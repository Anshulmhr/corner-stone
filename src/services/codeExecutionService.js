import { submissionContext, markUncertainSubmission } from './pilot.js';
/**
 * Client-side code execution service.
 *
 * Sends the user's code + problemId to the secure backend (/api/execute).
 * The backend assembles the test harness, calls Wandbox, grades the output,
 * and returns only browser-safe results (no hidden inputs or expected outputs).
 *
 * There is NO direct Wandbox fallback here — all execution is server-mediated.
 */

/**
 * Evaluate a C++ submission for the given problem.
 * Returns a result object compatible with TestResultsPanel.jsx.
 *
 * @param {string} problemId       - e.g. 'two-sum'
 * @param {string} userCode        - the student's C++ solution class code
 * @param {Array}  [attemptHistory] - previous attempts for this problem
 * @returns {Promise<object>}
 */
export async function evaluateCppSubmission(problemId, userCode, attemptHistory = [], pilotView = null) {
  // Client-side guard — catches empty submissions instantly without a round-trip
  if (!userCode || !userCode.trim()) {
    return {
      status:      'EMPTY_SUBMISSION',
      message:     'Please write your solution code before submitting.',
      passedCount: 0,
      totalCount:  0,
      results:     [],
      executionTimeMs: 0,
      diagnosis:   null,
    };
  }

function getApiEndpoint(path) {
  if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('undefined')) {
    return path;
  }
  const base = (typeof process !== 'undefined' && process.env?.API_BASE_URL) || 'http://127.0.0.1:3001';
  return `${base}${path}`;
}

  const pilot = await submissionContext(pilotView);
  let response;
  try {
    response = await fetch(getApiEndpoint('/api/execute'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...(pilot && {Authorization:'Bearer '+pilot.token}) },
      body:    JSON.stringify({ problemId, userCode, attemptHistory, pilot:pilot?.data }),
    });
  } catch (networkErr) {
    markUncertainSubmission(pilotView);
    return {
      status:  'EXECUTION_FAILED',
      message: `Cannot reach the execution server. Check your connection. (${networkErr.message})`,
      passedCount: 0,
      totalCount:  0,
      results:     [],
      executionTimeMs: 0,
      diagnosis:   null,
    };
  }

  // Handle HTTP-level errors
  if (!response.ok) {
    let errMsg = `Server error (HTTP ${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody.status) return errBody;
      if (errBody.error) errMsg = errBody.error;
    } catch (_) { /* ignore parse failure */ }

    if (response.status === 429) {
      return {
        status:  'RATE_LIMITED',
        message: 'Too many submissions. Please wait a moment before trying again.',
        passedCount: 0,
        totalCount:  0,
        results:     [],
        executionTimeMs: 0,
      };
    }

    return {
      status:  'EXECUTION_FAILED',
      message: errMsg,
      passedCount: 0,
      totalCount:  0,
      results:     [],
      executionTimeMs: 0,
    };
  }

  try {
    const verdict = await response.json();
    if (pilot && !verdict.submissionId) markUncertainSubmission(pilotView);
    return verdict;
  } catch (_) {
    markUncertainSubmission(pilotView);
    return {
      status:  'EXECUTION_FAILED',
      message: 'Received an invalid response from the execution server.',
      passedCount: 0,
      totalCount:  0,
      results:     [],
      executionTimeMs: 0,
    };
  }
}
