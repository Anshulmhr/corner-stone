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
const { TEST_SUITES, gradeOutput } = require('./testSuites.js');
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
}, RATE_WINDOW);

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capOutput(s) {
  if (!s) return '';
  return s.length > MAX_OUTPUT_BYTES
    ? s.slice(0, MAX_OUTPUT_BYTES) + '\n...[Output truncated]'
    : s;
}

async function callWandboxAttempt(fullSource) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT);
  const startMs    = Date.now();

  try {
    const resp = await fetch(WANDBOX_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        compiler: 'gcc-head',
        code:     fullSource,
        stdin:    '',
        options:  'c++17',
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const json         = await resp.json();
    const executionTimeMs = Date.now() - startMs;

    const status         = json.status !== undefined ? Number(json.status) : (json.compiler_error ? 1 : 0);
    const isCompileError = Boolean(json.compiler_error && status !== 0 && !json.program_output);
    const isRuntimeError = Boolean(status !== 0 && !isCompileError);

    return {
      ok:             true,
      status,
      compilerOutput: capOutput(json.compiler_output),
      compilerError:  capOutput(json.compiler_error),
      compilerMessage:capOutput(json.compiler_message),
      programOutput:  capOutput(json.program_output),
      programError:   capOutput(json.program_error),
      isCompileError,
      isRuntimeError,
      executionTimeMs,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok:             false,
      timedOut:       err.name === 'AbortError',
      error:          err.name === 'AbortError'
                        ? `Execution timed out after ${EXECUTION_TIMEOUT / 1000}s`
                        : err.message,
      executionTimeMs: Date.now() - startMs,
    };
  }
}

async function callWandbox(fullSource) {
  const result = await callWandboxAttempt(fullSource);
  // If transient socket/network error (not timeout), retry once after a short delay
  if (!result.ok && !result.timedOut) {
    await new Promise(r => setTimeout(r, 750));
    return await callWandboxAttempt(fullSource);
  }
  return result;
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
  const suite = TEST_SUITES[problemId];
  if (!suite) {
    return res.status(400).json({
      status:  'UNSUPPORTED_PROBLEM',
      message: `No C++ test suite configured for: ${problemId}`,
    });
  }

  // 5. Assemble harness server-side (hidden test values stay here)
  const fullSource = suite.buildHarness(userCode);

  // 6. Execute in Wandbox sandbox
  const exec = await callWandbox(fullSource);

  if (!exec.ok) {
    const isTimeout = Boolean(exec.timedOut);
    const status = isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'EXECUTION_FAILED';
    const diag = diagnose({
      status,
      totalCount: suite.totalCount,
      executionTimeMs: exec.executionTimeMs,
      attemptHistory,
    });

    return res.json({
      status,
      message: exec.error,
      passedCount: 0,
      totalCount:  suite.totalCount,
      results:     [],
      executionTimeMs: exec.executionTimeMs,
      diagnosis:   diag,
    });
  }

  // 7. Handle compilation errors
  if (exec.isCompileError || (exec.status !== 0 && exec.compilerError)) {
    const compilerError = exec.compilerError || exec.compilerMessage || 'Compilation failed.';
    const diag = diagnose({
      status:        'COMPILATION_ERROR',
      compilerError,
      totalCount:    suite.totalCount,
      executionTimeMs: exec.executionTimeMs,
      attemptHistory,
    });

    return res.json({
      status:        'COMPILATION_ERROR',
      compilerError,
      passedCount:   0,
      totalCount:    suite.totalCount,
      results:       [],
      executionTimeMs: exec.executionTimeMs,
      diagnosis:     diag,
    });
  }

  // 8. Handle runtime errors
  if (exec.isRuntimeError) {
    const runtimeError = exec.programError ||
                         `Process crashed (exit code ${exec.status}).`;
    const diag = diagnose({
      status:       'RUNTIME_ERROR',
      runtimeError,
      totalCount:   suite.totalCount,
      executionTimeMs: exec.executionTimeMs,
      attemptHistory,
    });

    return res.json({
      status:       'RUNTIME_ERROR',
      runtimeError,
      passedCount:  0,
      totalCount:   suite.totalCount,
      results:      [],
      executionTimeMs: exec.executionTimeMs,
      diagnosis:    diag,
    });
  }

  // 9. Grade outputs — hidden data never leaves this process
  const { passedCount, results } = gradeOutput(suite, exec.programOutput);
  const allPassed = passedCount === suite.totalCount;
  const status = allPassed ? 'ACCEPTED' : 'WRONG_ANSWER';

  const diag = diagnose({
    status,
    passedCount,
    totalCount:    suite.totalCount,
    gradedResults: results,
    suite,
    executionTimeMs: exec.executionTimeMs,
    attemptHistory,
  });

  return res.json({
    status,
    passedCount,
    totalCount:  suite.totalCount,
    results,
    executionTimeMs: exec.executionTimeMs,
    diagnosis:   diag,
  });
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

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[AdaptiveDSA API] Running on http://127.0.0.1:${PORT}`);
});

module.exports = app; // for testing
