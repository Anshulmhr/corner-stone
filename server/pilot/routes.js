'use strict';
const express = require('express');
const { randomUUID } = require('node:crypto');
const {
  openStore,
  uuid,
  validToken,
  CONSENT,
  enroll,
  identify,
  append,
  related,
  clientEvent,
} = require('./store.js');
let database;
const db = () => (database ||= openStore());
const tokenFrom = (req) => /^Bearer ([a-f0-9]{64})$/.exec(req.get('Authorization') || '')?.[1];
const router = express.Router();
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
router.post('/enroll', (req, res) => {
  const token = tokenFrom(req);
  if (!validToken(token) || req.body?.consent !== CONSENT) return res.sendStatus(400);
  enroll(db(), token);
  res.status(201).json({ consent: CONSENT });
});
router.post('/withdraw', (req, res) => {
  const token = tokenFrom(req);
  if (!validToken(token)) return res.sendStatus(401);
  const learner = identify(db(), token);
  if (learner) db().prepare('DELETE FROM learners WHERE id=?').run(learner);
  res.sendStatus(204);
});
router.post('/events', (req, res) => {
  const token = tokenFrom(req);
  const learner = validToken(token) && identify(db(), token);
  if (!learner) return res.sendStatus(401);
  clientEvent(db(), learner, req.body);
  res.sendStatus(204);
});
router.use((err, _req, res, _next) => {
  res
    .status(err.status === 400 ? 400 : 503)
    .json({ error: err.status === 400 ? 'Invalid pilot event.' : 'Pilot storage unavailable.' });
});

// A browser may report a view or hint. Only the judge may write a verdict.
// Failures in the optional collector must never interrupt normal grading.
function startSubmission(req, problem) {
  const token = tokenFrom(req);
  const ctx = req.body?.pilot;
  if (!validToken(token) || !ctx || !uuid(ctx.requestId) || !uuid(ctx.session)) return null;
  try {
    const store = db(),
      learner = identify(store, token);
    if (!learner || !related(store, learner, ctx.openId, ctx.session, problem, 'open')) return null;
    const submissionId = randomUUID();
    const added = append(store, learner, ctx.requestId, ctx.session, problem, 'submit', {
      submissionId,
      openId: ctx.openId,
      complete: ctx.complete === true,
      judge: 'per-case-v1',
    });
    return added ? { learner, session: ctx.session, problem, submissionId } : null;
  } catch {
    return null;
  }
}
function finishSubmission(capture, verdict) {
  if (!capture) return verdict;
  const { learner, session, problem, submissionId } = capture;
  try {
    append(db(), learner, submissionId, session, problem, 'verdict', {
      status: verdict.status,
      passed: verdict.passedCount,
      total: verdict.totalCount,
      source: 'server-judge',
    });
  } catch {
    return verdict;
  } // Includes withdrawal during grading.
  return { ...verdict, submissionId };
}
function closeStore() {
  database?.close();
  database = undefined;
}
module.exports = { router, startSubmission, finishSubmission, closeStore };
