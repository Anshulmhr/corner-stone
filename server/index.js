/**
 * server/index.js
 *
 * Minimal production-ready Express backend for AdaptiveDSA.
 * Responsibilities:
 *  - Assemble C++ test harnesses server-side
 *  - Call Wandbox GCC sandbox
 *  - Grade outputs server-side
 *  - Return only browser-safe results (no hidden inputs/expected outputs)
 *  - Enforce payload limits, execution timeout, output cap, basic rate limiting
 */

'use strict';

const express = require('express');
const pilot = require('./pilot/routes.js');
const path = require('node:path');
const compiler = require('../shared/compiler.json');
const { TEST_SUITES, gradeCase } = require('./testSuites.js');
const { diagnose } = require('./diagnosisEngine.js');
const { handleCoachRequest } = require('./coachService.js');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CODE_BYTES     = 50_000;   // 50 KB user code
const MAX_PAYLOAD_BYTES  = 100_000;  // 100 KB total request
const EXECUTION_TIMEOUT  = 15_000;   // 15 s wall-clock
const MAX_OUTPUT_BYTES   = 50_000;   // 50 KB stdout cap

// Wandbox endpoint — lives server-side only, never exposed to the browser
const WANDBOX_URL        = 'https://wandbox.org/api/compile.json';

// ─── In-memory rate limiter (per IP, per minute) ─────────────────────────────
const rateLimitMap = new Map(); // ip → { count, windowStart }
const RATE_LIMIT   = process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT, 10) : 120; // requests per window
const RATE_WINDOW  = 60_000;    // 1 minute

function checkRateLimit(ip) {
  const now  = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true; // allowed
  }

  if (entry.count >= RATE_LIMIT) return false; // blocked

  entry.count++;
  return true; // allowed
}

// Periodically prune stale entries
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW * 2;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.windowStart < cutoff) rateLimitMap.delete(ip);
  }
}, RATE_WINDOW).unref();

// ─── Middleware ───────────────────────────────────────────────────────────────
// Only accept JSON bodies within the size limit.
app.use(express.json({ limit: MAX_PAYLOAD_BYTES }));

// Allow CORS for local Vite dev (origin 5173) — production serves same-origin
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api/pilot', (req,res,next) => {
  if (!checkRateLimit('pilot:' + req.ip)) return res.sendStatus(429);
  next();
}, pilot.router);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capOutput(s) {
  if (!s) return '';
  return s.length > MAX_OUTPUT_BYTES
    ? s.slice(0, MAX_OUTPUT_BYTES) + '\n...[Output truncated]'
    : s;
}

async function runCase(suite, tc, userCode, signal) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler: compiler.compiler, options: compiler.options, stdin: '',
      code: suite.buildHarness(userCode, tc.id),
    }),
    signal,
  };
  let response;
  try {
    response = await fetch(WANDBOX_URL, options);
  } catch (error) {
    if (signal.aborted || error.name === 'AbortError') throw error;
    // Retry a dropped connection once within the same submission deadline.
    await new Promise(resolve => setTimeout(resolve, 750));
    response = await fetch(WANDBOX_URL, options);
  }
  if (!response.ok) throw new Error('Compiler service unavailable');
  const job = await response.json();
  const hasStatus = /^\d+$/.test(String(job?.status));
  if (!hasStatus && !job?.signal) throw new Error('Incomplete compiler response');

  if (job.signal || Number(job.status) !== 0) {
    // Hidden jobs must never return compiler source lines or student-printed data.
    const hidden = suite.hiddenIds.has(tc.id);
    if (job.signal && /CPU time limit|SIGXCPU/i.test(job.signal)) {
      return { status: 'TIME_LIMIT_EXCEEDED', judged: true, message: 'The program exceeded its CPU time limit.' };
    }
    if (!job.signal && job.compiler_error && !job.program_error && !job.program_output) {
      return { status: 'COMPILATION_ERROR', compilerError: hidden
        ? 'Compilation failed on a protected case.' : capOutput(job.compiler_error) };
    }
    return { status: 'RUNTIME_ERROR', runtimeError: hidden
      ? 'The program failed on a protected case.' : capOutput(job.program_error || job.signal || 'Program exited with status ' + job.status) };
  }
  return { result: gradeCase(suite, tc, capOutput(job.program_output)) };
}

// ─── POST /api/execute ────────────────────────────────────────────────────────
app.post('/api/execute', async (req, res) => {

  // 1. Rate limit
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // 2. Validate input
  const { problemId, userCode, attemptHistory } = req.body || {};

  if (!problemId || typeof problemId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid problemId.' });
  }
  if (!userCode || typeof userCode !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userCode.' });
  }
  if (userCode.length > MAX_CODE_BYTES) {
    return res.status(400).json({ error: `Code exceeds ${MAX_CODE_BYTES / 1000}KB limit.` });
  }

  // 3. Reject empty submissions (whitespace only)
  if (!userCode.trim()) {
    return res.json({
      status:      'EMPTY_SUBMISSION',
      message:     'Please write your solution before submitting.',
      passedCount: 0,
      totalCount:  0,
      results:     [],
      executionTimeMs: 0,
      diagnosis:   null,
    });
  }

  // 4. Look up test suite — server-side only
  const suite = Object.hasOwn(TEST_SUITES, problemId) && TEST_SUITES[problemId];
  if (!suite) {
    return res.status(400).json({
      status:  'UNSUPPORTED_PROBLEM',
      message: `No C++ test suite configured for: ${problemId}`,
    });
  }

  // The server binds each result to the job it launched. Student output cannot
  // declare another case passed. All jobs share one wall-clock deadline.
  const capture = pilot.startSubmission(req, problemId);
  const started = Date.now();
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT);
  let jobs;
  try {
    jobs = await Promise.all(suite.publicCases.map(tc => runCase(suite, tc, userCode, controller.signal)));
  } catch {
    controller.abort();
    return res.status(503).json(pilot.finishSubmission(capture, {
      status: 'EXECUTION_FAILED', message: 'The compiler service could not finish grading. Please retry.',
      passedCount: 0, totalCount: 0, results: [], diagnosis: null,
      executionTimeMs: Date.now() - started,
    }));
  } finally {
    clearTimeout(deadline);
  }

  const executionTimeMs = Date.now() - started;
  const failure = jobs.find(job => job.status);
  if (failure) {
    return res.json(pilot.finishSubmission(capture, {
      ...failure, passedCount: 0, totalCount: suite.totalCount, results: [], executionTimeMs,
      diagnosis: diagnose({ ...failure, totalCount: suite.totalCount, executionTimeMs, attemptHistory }),
    }));
  }

  const results = jobs.map(job => job.result);
  const passedCount = results.filter(result => result.passed).length;
  const totalCount = suite.totalCount;
  const status = passedCount === totalCount ? 'ACCEPTED' : 'WRONG_ANSWER';
  const diagnosis = diagnose({ status, passedCount, totalCount, gradedResults: results, suite, executionTimeMs, attemptHistory });
  return res.json(pilot.finishSubmission(capture, { status, passedCount, totalCount, results, executionTimeMs, diagnosis }));
});

// ─── POST /api/coach ──────────────────────────────────────────────────────────
app.post('/api/coach', async (req, res) => {
  // 1. Rate limit
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // 2. Validate input
  const {
    action = 'explain',
    problemId,
    problemTitle,
    topic,
    difficulty,
    problemSummary,
    userCode,
    submissionOutcome,
    hintLevel = 1,
    isBlindMode = false,
    attemptHistory = []
  } = req.body || {};

  if (!['explain', 'hint', 'test'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be explain, hint, or test.' });
  }

  // 3. Strict Blind Solve Check (Requirement #11)
  if (isBlindMode) {
    return res.status(403).json({
      ok: false,
      blockedByBlindMode: true,
      message: 'Learning Coach is disabled during Blind Solve Challenge Mode to protect independent problem-solving. Exit Blind Solve mode to access coach guidance.'
    });
  }

  // 4. Sanitize context — hidden test cases and grading harnesses are NEVER included
  const safeSubmissionOutcome = submissionOutcome ? {
    status: submissionOutcome.status,
    passedCount: submissionOutcome.passedCount,
    totalCount: submissionOutcome.totalCount,
    compilerError: submissionOutcome.compilerError,
    runtimeError: submissionOutcome.runtimeError,
    diagnosis: submissionOutcome.diagnosis ? {
      category: submissionOutcome.diagnosis.category,
      label: submissionOutcome.diagnosis.label,
      explanation: submissionOutcome.diagnosis.explanation,
      nextStep: submissionOutcome.diagnosis.nextStep
    } : null
  } : null;

  try {
    const coachResult = await handleCoachRequest({
      action,
      problemId,
      problemTitle,
      topic,
      difficulty,
      problemSummary,
      userCode,
      submissionOutcome: safeSubmissionOutcome,
      hintLevel,
      isBlindMode: false,
      attemptHistory
    });

    return res.json(coachResult);
  } catch (err) {
    console.error('[Coach API Error]:', err);
    return res.status(500).json({
      ok: false,
      error: 'COACH_ERROR',
      message: 'Coach encountered an error. Please try again.'
    });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint' }));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  app.listen(PORT, host, () => {
    console.log(`[AdaptiveDSA API] Running on http://${host}:${PORT}`);
  });
}

module.exports = app; // for testing
