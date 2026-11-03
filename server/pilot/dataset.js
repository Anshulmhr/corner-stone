'use strict';
const { createHash } = require('node:crypto');
const { catalogue } = require('./store.js');

const judged = new Set([
  'ACCEPTED',
  'WRONG_ANSWER',
  'COMPILATION_ERROR',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
]);
function splitFor(learner) {
  const bucket =
    createHash('sha256')
      .update('pilot-split-v1:' + learner)
      .digest()
      .readUInt32BE(0) % 100;
  return bucket < 70 ? 'train' : bucket < 85 ? 'validation' : 'test';
}
function counters() {
  return { attempts: 0, successes: 0, helpViews: 0, lastAttempt: null };
}

// The database sequence is the observation order. In particular, a verdict
// that arrives after a different problem opens cannot enter its snapshot.
function dataset(db, withReflections = false) {
  const learners = db
    .prepare('SELECT id FROM learners ORDER BY id')
    .all()
    .map((x) => ({
      learner: x.id,
      split: splitFor(x.id),
    }));
  const pairs = new Map(),
    history = new Map(),
    submissions = new Map(),
    opens = new Map();
  const recommendations = new Map(),
    explanations = [],
    reviews = [],
    examples = [];
  const excluded = {},
    outcomes = {},
    observations = [];
  const coverage = Object.fromEntries(
    [...new Set([...catalogue.values()].map((p) => p.topic))].map((t) => [
      t,
      { rows: 0, positive: 0, negative: 0 },
    ])
  );
  const ratings = new Map();
  if (withReflections) {
    for (const row of db.prepare('SELECT * FROM ratings ORDER BY event_seq, role, reviewer').all()) {
      if (!ratings.has(row.event_seq)) ratings.set(row.event_seq, []);
      ratings.get(row.event_seq).push({ reviewer: row.reviewer, role: row.role, label: row.label });
    }
  }
  for (const e of db.prepare('SELECT * FROM events ORDER BY seq').iterate()) {
    const d = JSON.parse(e.data),
      pairKey = e.learner + ':' + e.problem,
      topicKey = e.learner + ':' + e.topic;
    if (!pairs.has(pairKey))
      pairs.set(pairKey, { opens: [], submits: [], manual: [], reviews: [], help: [] });
    if (!history.has(topicKey)) history.set(topicKey, counters());
    const pair = pairs.get(pairKey),
      prior = history.get(topicKey);
    const base = {
      learner: e.learner,
      split: splitFor(e.learner),
      problem: e.problem,
      topic: e.topic,
      difficulty: e.difficulty,
      session: e.session,
      atMs: e.at_ms,
    };
    if (e.kind !== 'reflection')
      observations.push({ ...base, eventId: e.id, seq: e.seq, kind: e.kind, ...d });
    const key = (id) => e.learner + ':' + id;
    switch (e.kind) {
      case 'recommendation':
        recommendations.set(key(e.id), { ...base, exposureId: e.id, ...d, opened: false, attempted: false });
        break;
      case 'open': {
        const open = {
          ...base,
          id: e.id,
          seq: e.seq,
          ...d,
          answers: [],
          features: {
            priorTopicAttempts: prior.attempts,
            priorTopicSuccessRate: prior.attempts ? prior.successes / prior.attempts : null,
            priorTopicHelpViews: prior.helpViews,
            msSinceTopicAttempt: prior.lastAttempt === null ? null : Math.max(0, e.at_ms - prior.lastAttempt),
          },
        };
        pair.opens.push(open);
        opens.set(key(e.id), open);
        const rec = recommendations.get(key(d.recommendationId));
        if (rec) rec.opened = true;
        break;
      }
      case 'familiarity':
        opens.get(key(d.openId))?.answers.push({ seq: e.seq, answer: d.answer });
        break;
      case 'help':
      case 'revision-help':
        prior.helpViews++;
        pair.help.push(e.seq);
        break;
      case 'revision':
        pair.reviews.push(e.seq);
        reviews.push({ ...base, eventId: e.id, outcome: d.outcome, source: 'self-report' });
        break;
      case 'manual':
      case 'submit': {
        const open = opens.get(key(d.openId)),
          rec = recommendations.get(key(open?.recommendationId));
        if (rec) rec.attempted = true;
        if (e.kind === 'manual') {
          pair.manual.push(e.seq);
          break;
        }
        const sub = { ...d, seq: e.seq, verdict: null };
        pair.submits.push(sub);
        submissions.set(key(d.submissionId), sub);
        break;
      }
      case 'verdict': {
        const sub = submissions.get(key(e.id));
        if (!sub) break;
        sub.verdict = d;
        outcomes[d.status] = (outcomes[d.status] || 0) + 1;
        if (judged.has(d.status)) {
          prior.attempts++;
          prior.successes += Number(d.status === 'ACCEPTED');
          prior.lastAttempt = e.at_ms;
        }
        break;
      }
      case 'reflection':
        if (withReflections)
          explanations.push({
            ...base,
            reflectionId: e.id,
            openId: d.openId,
            text: d.text,
            quizOption: d.quizOption,
            prompt: d.prompt,
            rubric: d.rubric,
            ratings: ratings.get(e.seq) || [],
          });
        break;
    }
  }
  for (const pair of pairs.values()) {
    const open = pair.opens[0];
    if (!open) continue;
    // Skip known provider failures. An unfinished earlier request has unknown
    // ground truth, so a later result cannot silently become the first attempt.
    const sub = pair.submits.find((s) => !s.verdict || judged.has(s.verdict.status));
    let reason;
    if (!sub)
      reason = pair.submits.length ? 'ungraded_only' : pair.manual.length ? 'manual_only' : 'no_submission';
    else if (!sub.verdict) reason = 'pending_verdict';
    else if (!sub.complete) reason = 'incomplete_history';
    else if (sub.openId !== open.id) reason = 'repeat_exposure';
    else if (
      open.previouslyPracticed ||
      pair.manual.some((seq) => seq < sub.seq) ||
      pair.reviews.some((seq) => seq < sub.seq)
    )
      reason = 'prior_practice';
    else if (open.answers.find((a) => a.seq < sub.seq)?.answer !== 'new') reason = 'unknown_or_seen';
    if (reason) {
      excluded[reason] = (excluded[reason] || 0) + 1;
      continue;
    }
    const aided = pair.help.some((seq) => seq < sub.seq);
    const label = Number(sub.verdict.status === 'ACCEPTED' && !aided);
    examples.push({
      learner: open.learner,
      split: open.split,
      problem: open.problem,
      topic: open.topic,
      difficulty: open.difficulty,
      openedAtMs: open.atMs,
      openId: open.id,
      submissionId: sub.submissionId,
      judge: sub.judge,
      ...open.features,
      label,
    });
    coverage[open.topic].rows++;
    coverage[open.topic][label ? 'positive' : 'negative']++;
  }
  return {
    examples,
    observations,
    recommendations: [...recommendations.values()],
    explanations,
    reviews,
    learners,
    summary: {
      version: 'pilot-dataset-v1',
      consent: 'pilot-v1',
      learners: learners.length,
      examples: examples.length,
      positives: examples.filter((e) => e.label).length,
      negatives: examples.filter((e) => !e.label).length,
      byTopic: coverage,
      byDifficulty: Object.fromEntries(
        [...new Set([...catalogue.values()].map((p) => p.difficulty))].map((d) => [
          d,
          examples.filter((e) => e.difficulty === d).length,
        ])
      ),
      excluded,
      outcomes,
      splits: Object.fromEntries(
        ['train', 'validation', 'test'].map((s) => [
          s,
          {
            learners: learners.filter((x) => x.split === s).length,
            examples: examples.filter((x) => x.split === s).length,
          },
        ])
      ),
    },
  };
}
module.exports = { dataset, splitFor };
