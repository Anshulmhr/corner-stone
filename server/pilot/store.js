'use strict';
const { DatabaseSync } = require('node:sqlite');
const { randomUUID, createHash } = require('node:crypto');
const { mkdirSync, openSync, closeSync } = require('node:fs');
const path = require('node:path');
const { PROBLEMS } = require('../../src/data/problems.js');
const catalogue = new Map(PROBLEMS.map((p) => [p.id, p]));
const uuid = (value) =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const CONSENT = 'pilot-v1';
const POLICY = 'rules-v1';
const validToken = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
const defaultPath = () => process.env.PILOT_DB_PATH || path.resolve(__dirname, '../../data/pilot.sqlite');
function openStore(filename = defaultPath()) {
  if (filename !== ':memory:') {
    const target = path.resolve(filename);
    for (const name of ['dist', 'public']) {
      const web = path.resolve(__dirname, '../..', name);
      if (target === web || target.startsWith(web + path.sep))
        throw Error('The pilot database must be outside the web root.');
    }
    mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    closeSync(openSync(target, 'a', 0o600));
  }
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS learners (
    id TEXT PRIMARY KEY, credential TEXT UNIQUE NOT NULL, consent TEXT NOT NULL, joined_ms INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS events (
    seq INTEGER PRIMARY KEY, learner TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
    id TEXT NOT NULL, session TEXT NOT NULL, problem TEXT NOT NULL, topic TEXT NOT NULL,
    difficulty TEXT NOT NULL, kind TEXT NOT NULL, at_ms INTEGER NOT NULL, data TEXT NOT NULL,
    UNIQUE(learner,id));
  CREATE INDEX IF NOT EXISTS by_problem ON events(learner,problem,seq);
  CREATE TABLE IF NOT EXISTS ratings (
    event_seq INTEGER REFERENCES events(seq) ON DELETE CASCADE, reviewer TEXT NOT NULL,
    role TEXT NOT NULL, label TEXT NOT NULL, PRIMARY KEY(event_seq, reviewer, role));
  CREATE UNIQUE INDEX IF NOT EXISTS final_rating ON ratings(event_seq) WHERE role='adjudicated';`);
  return db;
}
function enroll(db, token) {
  db.prepare('INSERT INTO learners VALUES(?,?,?,?) ON CONFLICT(credential) DO NOTHING').run(
    randomUUID(),
    digest(token),
    CONSENT,
    Date.now()
  );
}
function identify(db, token) {
  if (!validToken(token)) return null;
  return db.prepare('SELECT id FROM learners WHERE credential=?').get(digest(token))?.id;
}
function append(db, learner, id, session, problem, kind, data) {
  const p = catalogue.get(problem);
  return db
    .prepare(
      `INSERT INTO events(learner,id,session,problem,topic,difficulty,kind,at_ms,data)
    VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(learner,id) DO NOTHING`
    )
    .run(learner, id, session, problem, p.topic, p.difficulty, kind, Date.now(), JSON.stringify(data))
    .changes;
}
function invalid() {
  throw Object.assign(new Error('Invalid pilot event.'), { status: 400 });
}
function oneOf(value, allowed) {
  return allowed.includes(value) ? value : invalid();
}
function bounded(value, limit) {
  return typeof value === 'string' && value.trim() && value.length <= limit ? value.trim() : invalid();
}
function related(db, learner, id, session, problem, kind) {
  return (
    uuid(id) &&
    !!db
      .prepare('SELECT 1 FROM events WHERE learner=? AND id=? AND session=? AND problem=? AND kind=?')
      .get(learner, id, session, problem, kind)
  );
}
function clientEvent(db, learner, e) {
  if (!e || !uuid(e.id) || !uuid(e.session) || !catalogue.has(e.problem)) invalid();
  const { id, session, problem, kind } = e;
  let data;
  if (kind === 'recommendation') {
    if (
      !Array.isArray(e.candidates) ||
      e.candidates.length > catalogue.size ||
      !e.candidates.includes(problem) ||
      !e.candidates.every((p) => catalogue.has(p))
    )
      invalid();
    data = {
      candidates: [...new Set(e.candidates)],
      reason: bounded(e.reason, 600),
      policy: POLICY,
      surface: oneOf(e.surface, ['dashboard', 'solver', 'roadmap']),
    };
  } else if (kind === 'open') {
    if (typeof e.previouslyPracticed !== 'boolean') invalid();
    if (e.recommendationId && !related(db, learner, e.recommendationId, session, problem, 'recommendation'))
      invalid();
    data = { previouslyPracticed: e.previouslyPracticed, recommendationId: e.recommendationId || null };
  } else if (kind === 'revision-help') {
    data = { source: 'revision-hint', level: 1 };
  } else if (kind === 'revision') {
    data = { outcome: oneOf(e.outcome, ['independent', 'with_hints', 'failed']) };
  } else {
    if (!related(db, learner, e.openId, session, problem, 'open')) invalid();
    data = { openId: e.openId };
    switch (kind) {
      case 'familiarity':
        data.answer = oneOf(e.answer, ['new', 'seen', 'unsure']);
        break;
      case 'help':
        data.source = oneOf(e.source, ['hint', 'coach-hint', 'coach-explain', 'coach-test', 'quiz-feedback']);
        data.level = oneOf(e.level, [0, 1, 2, 3]);
        break;
      case 'manual':
        break;
      case 'reflection':
        if (e.share !== true) invalid();
        data.text = bounded(e.text, 4000);
        data.quizOption = oneOf(e.quizOption, [null, 0, 1, 2, 3]);
        data.prompt = 'approach-v1';
        data.rubric = 'concept-v1';
        break;
      default:
        invalid();
    }
  }
  append(db, learner, id, session, problem, kind, data);
}
module.exports = {
  openStore,
  defaultPath,
  catalogue,
  uuid,
  validToken,
  CONSENT,
  enroll,
  identify,
  append,
  related,
  clientEvent,
};
