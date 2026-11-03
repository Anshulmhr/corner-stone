/**
 * src/services/coachService.js
 *
 * Client-side communication service for the Context-Aware AI Learning Coach.
 *
 * Transmits only safe, public context to the server:
 *  - Problem metadata (id, title, topic, difficulty, summary)
 *  - Student's current code
 *  - Latest submission outcome (browser-safe test results, compiler errors, diagnosis)
 *  - Requested action ('explain' | 'hint' | 'test')
 *  - Current progressive hint level
 *  - Blind solve mode status
 *
 * Hidden test cases and grading harnesses are NEVER exposed or transmitted.
 * AI credentials remain exclusively on the server.
 */

/**
 * Request guidance from the AI Learning Coach.
 *
 * @param {object} params
 * @param {string} params.action              - 'explain' | 'hint' | 'test'
 * @param {object} params.problem             - Problem metadata object
 * @param {string} [params.userCode]          - The student's current C++ code draft
 * @param {object} [params.submissionOutcome] - Latest execution/diagnosis result
 * @param {number} [params.hintLevel]         - Requested progressive hint level (1, 2, 3)
 * @param {boolean}[params.isBlindMode]       - Whether Blind Solve mode is currently active
 * @param {Array}  [params.attemptHistory]    - Recent attempts for this problem
 * @returns {Promise<object>}                 - Response with coach guidance or error
 */
export async function requestCoachGuidance({
  action = 'explain',
  problem,
  userCode = '',
  submissionOutcome = null,
  hintLevel = 1,
  isBlindMode = false,
  attemptHistory = []
}) {
  // Client-side guard for Blind Solve mode
  if (isBlindMode) {
    return {
      ok: false,
      blockedByBlindMode: true,
      message: 'Learning Coach is disabled during Blind Solve Challenge Mode to protect independent problem-solving. Exit Blind Solve mode to access coach guidance.'
    };
  }

  const payload = {
    action,
    problemId: problem?.id,
    problemTitle: problem?.title,
    topic: problem?.topic,
    difficulty: problem?.difficulty,
    problemSummary: problem?.summary || '',
    userCode,
    submissionOutcome: submissionOutcome ? {
      status: submissionOutcome.status,
      passedCount: submissionOutcome.passedCount,
      totalCount: submissionOutcome.totalCount,
      compilerError: submissionOutcome.compilerError,
      runtimeError: submissionOutcome.runtimeError,
      diagnosis: submissionOutcome.diagnosis
    } : null,
    hintLevel,
    isBlindMode,
    attemptHistory: attemptHistory.slice(0, 5)
  };

  function getApiEndpoint(path) {
    if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('undefined')) {
      return path;
    }
    const base = (typeof process !== 'undefined' && process.env?.API_BASE_URL) || 'http://127.0.0.1:3001';
    return `${base}${path}`;
  }

  try {
    const res = await fetch(getApiEndpoint('/api/coach'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 403 && data.blockedByBlindMode) {
        return {
          ok: false,
          blockedByBlindMode: true,
          message: data.message || 'Learning Coach is disabled during Blind Solve Challenge Mode.'
        };
      }
      return {
        ok: false,
        error: data.error || 'COACH_REQUEST_FAILED',
        message: data.message || data.error || `Server returned error (${res.status})`
      };
    }

    return data;
  } catch (err) {
    return {
      ok: false,
      error: 'NETWORK_ERROR',
      message: `Unable to connect to the Learning Coach: ${err.message}`
    };
  }
}
