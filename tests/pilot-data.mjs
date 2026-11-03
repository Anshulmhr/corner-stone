import assert from 'node:assert/strict';
import { randomBytes, randomUUID as id } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../server/index.js';
import pilotRoutes from '../server/pilot/routes.js';
import store from '../server/pilot/store.js';
import analysis from '../server/pilot/dataset.js';
import fixtures from '../server/testSuites.js';

test('consent, trustworthy grade linkage, replay-safe events, export and withdrawal', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adaptivedsa-pilot-'));
  process.env.PILOT_DB_PATH = path.join(tmp, 'pilot.sqlite');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const http = global.fetch,
    base = 'http://127.0.0.1:' + server.address().port;
  const token = randomBytes(32).toString('hex'),
    session = id(),
    problem = 'two-sum';
  const post = (route, body, auth = token) =>
    http(base + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth && { Authorization: 'Bearer ' + auth }) },
      body: JSON.stringify(body),
    });
  const event = (kind, data = {}) => post('/api/pilot/events', { id: id(), session, problem, kind, ...data });
  const userCode = '// synthetic private source marker';
  const suite = fixtures.TEST_SUITES[problem];
  const cases = new Map(suite.publicCases.map((tc) => [suite.buildHarness(userCode, tc.id), tc]));
  let db,
    outage = false;
  global.fetch = async (url, opts) => {
    assert.equal(new URL(url).hostname, 'wandbox.org');
    const tc = cases.get(JSON.parse(opts.body).code);
    assert.ok(tc);
    return outage
      ? new Response('', { status: 503 })
      : Response.json({ status: '0', program_output: suite.expectedOutputs[tc.id] });
  };
  try {
    assert.equal((await post('/api/pilot/events', {}, null)).status, 401);
    assert.equal((await post('/api/execute', { problemId: problem, userCode }, null)).status, 200);
    assert.equal(fs.existsSync(process.env.PILOT_DB_PATH), false);
    assert.equal((await post('/api/pilot/enroll', { consent: 'wrong' })).status, 400);
    assert.equal((await post('/api/pilot/enroll', { consent: 'pilot-v1' })).status, 201);
    db = store.openStore();
    const learner = store.identify(db, token);
    const rec = id(),
      openId = id();
    const recEvent = { id: rec, candidates: [problem], reason: 'Beginner baseline', surface: 'dashboard' };
    for (let i = 0; i < 2; i++) assert.equal((await event('recommendation', recEvent)).status, 204);
    await event('open', { id: openId, previouslyPracticed: false, recommendationId: rec });
    await event('familiarity', { openId, answer: 'new' });
    assert.equal((await event('verdict', { openId, status: 'ACCEPTED' })).status, 400);
    const ctx = { openId, requestId: id(), session, complete: true };
    const run = (pilot) => post('/api/execute', { problemId: problem, userCode, pilot });
    outage = true;
    assert.equal((await run(ctx)).status, 503);
    assert.equal(analysis.dataset(db).examples.length, 0);
    outage = false;
    await event('help', { openId, source: 'hint', level: 1 });
    const retry = { ...ctx, requestId: id() };
    const verdict = await (await run(retry)).json();
    assert.ok(store.uuid(verdict.submissionId));
    await run(retry); // Duplicate transport cannot mint another pilot attempt.
    const text = 'Explain the synthetic invariant.';
    assert.equal((await event('reflection', { openId, share: false, text, quizOption: null })).status, 400);
    const reflectionId = id();
    await event('reflection', { id: reflectionId, openId, share: true, text, quizOption: 2 });
    let snapshot = analysis.dataset(db);
    assert.equal(snapshot.examples.length, 1);
    assert.equal(snapshot.examples[0].label, 0);
    assert.equal(snapshot.examples[0].priorTopicHelpViews, 0);
    assert.equal(snapshot.examples[0].priorTopicAttempts, 0);
    assert.equal(snapshot.recommendations.length, 1);
    assert.ok(snapshot.recommendations[0].opened && snapshot.recommendations[0].attempted);
    assert.equal(snapshot.summary.outcomes.ACCEPTED, 1);
    assert.ok(!JSON.stringify(snapshot).includes(text));
    assert.ok(!JSON.stringify(snapshot).includes(userCode));
    assert.ok(!JSON.stringify(snapshot).includes(token));
    const cli = (...args) =>
      execFileSync(process.execPath, ['scripts/pilot.mjs', ...args], { encoding: 'utf8', stdio: 'pipe' });
    const ratings = path.join(tmp, 'ratings.jsonl');
    fs.writeFileSync(
      ratings,
      ['r1', 'r2', 'r3']
        .map((reviewer, i) =>
          JSON.stringify({
            learner,
            reflectionId,
            reviewer,
            role: i === 2 ? 'adjudicated' : 'independent',
            label: 'partial',
          })
        )
        .join('\n')
    );
    cli('rate', ratings);
    cli('export', path.join(tmp, 'ordinary'));
    cli('export', path.join(tmp, 'restricted'), '--with-reflections');
    assert.ok(!fs.existsSync(path.join(tmp, 'ordinary', 'restricted-explanations.jsonl')));
    const reflection = JSON.parse(
      fs.readFileSync(path.join(tmp, 'restricted', 'restricted-explanations.jsonl'), 'utf8')
    );
    assert.equal(reflection.text, text);
    assert.equal(reflection.ratings.length, 3);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(tmp, 'ordinary', 'first-attempts.jsonl'), 'utf8')),
      snapshot.examples[0]
    );
    assert.equal((await post('/api/pilot/withdraw', {})).status, 204);
    assert.equal((await event('help', { openId, source: 'hint', level: 2 })).status, 401);
    assert.equal(db.prepare('SELECT count(*) AS n FROM ratings').get().n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM events').get().n, 0);
  } finally {
    global.fetch = http;
    db?.close();
    await new Promise((r) => server.close(r));
    pilotRoutes.closeStore();
    delete process.env.PILOT_DB_PATH;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('labels and features use the first exposure and only evidence observable then', () => {
  const db = store.openStore(':memory:'),
    token = randomBytes(32).toString('hex'),
    session = id();
  try {
    store.enroll(db, token);
    const learner = store.identify(db, token);
    function add(problem, kind, data) {
      const eid = id();
      store.append(db, learner, eid, session, problem, kind, data);
      return eid;
    }
    function open(problem, answer, known = false) {
      const openId = add(problem, 'open', { previouslyPracticed: known });
      if (answer) add(problem, 'familiarity', { openId, answer });
      return openId;
    }
    function start(problem, openId, complete = true) {
      const submissionId = id();
      add(problem, 'submit', { submissionId, openId, complete, judge: 'v1' });
      return submissionId;
    }
    function finish(problem, sid, status) {
      store.append(db, learner, sid, session, problem, 'verdict', {
        status,
        passed: status === 'ACCEPTED' ? 4 : 0,
        total: 4,
      });
    }
    const a = 'two-sum',
      b = 'contains-duplicate',
      c = 'product-of-array-except-self';
    const av = open(a, 'new'),
      as = start(a, av);
    const bv = open(b, 'new');
    finish(a, as, 'ACCEPTED');
    finish(b, start(b, bv), 'WRONG_ANSWER');
    const cv = open(c, 'new');
    finish(c, start(c, cv), 'ACCEPTED');
    for (const [problem, prior, known] of [
      ['binary-search', 'seen', false],
      ['valid-anagram', null, false],
      ['same-tree', 'new', true],
    ]) {
      finish(problem, start(problem, open(problem, prior, known)), 'ACCEPTED');
    }
    const m = open('valid-parentheses', 'new');
    add('valid-parentheses', 'manual', { openId: m });
    const gap = open('invert-binary-tree', 'new');
    finish('invert-binary-tree', start('invert-binary-tree', gap, false), 'ACCEPTED');
    const s = analysis.dataset(db);
    assert.deepEqual(
      s.examples.map((x) => [x.problem, x.label, x.priorTopicAttempts]),
      [
        [a, 1, 0],
        [b, 0, 0],
        [c, 1, 2],
      ]
    );
    assert.equal(s.examples[2].priorTopicSuccessRate, 0.5);
    assert.equal(new Set(s.examples.map((x) => x.split)).size, 1);
    assert.deepEqual(s.summary.excluded, {
      unknown_or_seen: 2,
      prior_practice: 1,
      manual_only: 1,
      incomplete_history: 1,
    });
  } finally {
    db.close();
  }
});
