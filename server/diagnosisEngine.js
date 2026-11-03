/**
 * server/diagnosisEngine.js
 *
 * SERVER-SIDE ONLY — Mistake Diagnosis Engine.
 *
 * Analyses execution results, graded test-case outcomes, and compiler output
 * to classify the likely category of mistake and produce a short, actionable
 * explanation.  Runs after grading so it has access to hidden-test pass/fail
 * patterns without ever leaking hidden data to the browser.
 *
 * Returns a browser-safe diagnosis object:
 *   { category, label, explanation, nextStep }
 *
 * Categories:
 *   COMPILATION_ERROR   — GCC rejected the code
 *   RUNTIME_ERROR       — compiled but crashed (segfault, abort, exception)
 *   EDGE_CASE_FAILURE   — visible tests pass, hidden test(s) fail
 *   LOGIC_ERROR         — most or all tests fail, including visible ones
 *   PARTIAL_LOGIC_ERROR — some visible tests pass, some fail
 *   BOUNDARY_ERROR      — outputs are off by one or differ by a constant
 *   OUTPUT_FORMAT_ERROR — outputs look correct but differ in formatting
 *   TLE                 — execution timed out
 *   UNKNOWN             — insufficient evidence to classify
 */

'use strict';

/**
 * Diagnose a submission given the full server-side grading context.
 *
 * @param {object} params
 * @param {string} params.status            - Overall status (ACCEPTED, WRONG_ANSWER, etc.)
 * @param {string} [params.compilerError]   - Raw GCC error output if compilation failed
 * @param {string} [params.runtimeError]    - Runtime error / stderr
 * @param {number} params.passedCount       - Tests passed
 * @param {number} params.totalCount        - Total tests
 * @param {Array}  params.gradedResults     - Server-side graded results (with hidden info)
 * @param {object} params.suite             - The test suite (has hiddenIds)
 * @param {number} params.executionTimeMs   - Wall-clock ms
 * @returns {object|null}                   - { category, label, explanation, nextStep } or null for ACCEPTED
 */
function diagnose({ status, compilerError, runtimeError, passedCount, totalCount,
                     gradedResults, suite, executionTimeMs, attemptHistory }) {

  // ── No diagnosis for accepted submissions ──
  if (status === 'ACCEPTED') return null;

  let result = null;

  // ── 1. Compilation Error ──
  if (status === 'COMPILATION_ERROR') {
    result = diagnoseCompilationError(compilerError || '');
  }

  // ── 2. Runtime Error ──
  else if (status === 'RUNTIME_ERROR') {
    result = diagnoseRuntimeError(runtimeError || '');
  }

  // ── 3. Time Limit Exceeded ──
  else if (status === 'TIME_LIMIT_EXCEEDED') {
    result = {
      category:    'TLE',
      label:       'Time Complexity Issue',
      explanation: `Your solution exceeded the ${Math.round(executionTimeMs / 1000)}s time limit. `
                 + "This usually means the algorithm's time complexity is too high for the input size.",
      nextStep:    'Review your approach for nested loops or repeated work. '
                 + 'Can you reduce O(n²) to O(n) with a hash map, or O(n log n) with sorting?',
    };
  }

  // ── 4. Wrong Answer — deeper analysis ──
  else if (status === 'WRONG_ANSWER' && gradedResults && gradedResults.length > 0) {
    result = diagnoseWrongAnswer(gradedResults, suite, passedCount, totalCount);
  }

  // ── Fallback ──
  else {
    result = {
      category:    'UNKNOWN',
      label:       'Unable to Determine Cause',
      explanation: 'The submission did not pass, but there is insufficient evidence '
                 + 'to classify the specific mistake.',
      nextStep:    'Review the test case results above and trace your logic manually '
                 + 'with the sample inputs.',
    };
  }

  // ── 5. Attempt History Insights ──
  if (result && Array.isArray(attemptHistory) && attemptHistory.length > 0) {
    const recentAttempts = attemptHistory.slice(0, 5);
    const sameFailures = recentAttempts.filter(a => !a.success && (a.status === status || a.status === result.category)).length;
    if (sameFailures >= 2) {
      result.historyNote = `Observed similar failures across ${sameFailures + 1} recent attempts. Consider stepping back and tracing through an edge case manually.`;
    }
  }

  return result;
}


// ─── Sub-diagnoses ──────────────────────────────────────────────────────────

function diagnoseCompilationError(compilerError) {
  const err = compilerError.toLowerCase();

  // Classify common GCC error patterns
  if (err.includes('was not declared in this scope') || err.includes('undeclared identifier')) {
    return {
      category:    'COMPILATION_ERROR',
      label:       'Undeclared Variable or Function',
      explanation: 'The compiler cannot find a variable or function you referenced. '
                 + 'This is usually a typo, a missing #include, or using a name before declaring it.',
      nextStep:    'Check the error line number. Verify spelling, that you included the right '
                 + 'headers, and that your variable is declared before its first use.',
    };
  }

  if (err.includes('expected') && (err.includes(';') || err.includes('}'))) {
    return {
      category:    'COMPILATION_ERROR',
      label:       'Missing Syntax Token',
      explanation: 'The compiler expected a semicolon, brace, or other punctuation that is missing.',
      nextStep:    'Go to the line number in the error. Check for missing semicolons at the end '
                 + 'of statements and matching braces for every block.',
    };
  }

  if (err.includes('no matching function') || err.includes('cannot convert')
      || err.includes('no viable conversion')) {
    return {
      category:    'COMPILATION_ERROR',
      label:       'Type Mismatch or Wrong Arguments',
      explanation: 'You are calling a function with the wrong number or type of arguments, '
                 + 'or assigning an incompatible type.',
      nextStep:    'Check the function signature you are calling. Make sure argument types match '
                 + 'and you are returning the correct type.',
    };
  }

  if (err.includes('redefinition') || err.includes('redeclared')) {
    return {
      category:    'COMPILATION_ERROR',
      label:       'Duplicate Definition',
      explanation: 'A variable, function, or class is defined more than once.',
      nextStep:    'Remove the duplicate definition. If you have #include guards, verify they '
                 + 'are set up correctly.',
    };
  }

  // Generic compilation error
  return {
    category:    'COMPILATION_ERROR',
    label:       'Syntax or Compilation Error',
    explanation: 'GCC could not compile your code. Read the compiler output above — the '
               + 'error message includes the file, line number, and a description of the issue.',
    nextStep:    'Start by fixing the first error listed — later errors are often caused '
               + 'by the first one. Check for missing semicolons, braces, and type mismatches.',
  };
}


function diagnoseRuntimeError(runtimeError) {
  const err = runtimeError.toLowerCase();

  if (err.includes('segfault') || err.includes('segmentation fault')
      || err.includes('signal 11')) {
    return {
      category:    'RUNTIME_ERROR',
      label:       'Segmentation Fault (Memory Access)',
      explanation: 'Your program accessed memory outside its allocated range. '
                 + 'Common causes: array index out of bounds, dereferencing a null/dangling pointer.',
      nextStep:    'Check all array accesses — are you reading past the end? '
                 + 'Verify loop bounds and pointer validity.',
    };
  }

  if (err.includes('abort') || err.includes('signal 6')) {
    return {
      category:    'RUNTIME_ERROR',
      label:       'Program Aborted',
      explanation: 'The program called abort(), often triggered by a failed assertion, '
                 + 'out-of-range access on std::vector::at(), or an unhandled exception.',
      nextStep:    'Look for .at() calls, assert() statements, or exceptions that are not caught. '
                 + 'Use operator[] cautiously and validate indices.',
    };
  }

  if (err.includes('stack overflow') || err.includes('signal 7')) {
    return {
      category:    'RUNTIME_ERROR',
      label:       'Stack Overflow (Infinite Recursion)',
      explanation: 'Your program ran out of stack space, usually from infinite or very deep recursion.',
      nextStep:    "Check your recursive function's base case. Make sure each recursive call "
                 + 'reduces the problem toward that base case.',
    };
  }

  return {
    category:    'RUNTIME_ERROR',
    label:       'Runtime Crash',
    explanation: 'Your solution compiled but crashed during execution. '
               + 'This may be caused by invalid memory access, division by zero, '
               + 'or an unhandled exception.',
    nextStep:    'Trace your code with the sample inputs. Check for division by zero, '
               + 'out-of-bounds access, and unhandled exception paths.',
  };
}


function diagnoseWrongAnswer(gradedResults, suite, passedCount, totalCount) {
  // Separate visible vs hidden results using server-side knowledge
  const visibleResults = [];
  const hiddenResults  = [];

  for (const r of gradedResults) {
    if (suite.hiddenIds.has(r.id)) {
      hiddenResults.push(r);
    } else {
      visibleResults.push(r);
    }
  }

  const visiblePassed = visibleResults.filter(r => r.passed).length;
  const visibleFailed = visibleResults.filter(r => !r.passed).length;
  const hiddenPassed  = hiddenResults.filter(r => r.passed).length;
  const hiddenFailed  = hiddenResults.filter(r => !r.passed).length;

  // ── Pattern 1: All visible pass, only hidden fail → Edge-case failure ──
  if (visiblePassed === visibleResults.length && hiddenFailed > 0) {
    return {
      category:    'EDGE_CASE_FAILURE',
      label:       'Edge-Case Failure',
      explanation: `Your solution passes all ${visiblePassed} visible sample tests but fails `
                 + `${hiddenFailed} hidden test${hiddenFailed > 1 ? 's' : ''}. `
                 + 'Hidden tests typically cover boundary conditions, special values, '
                 + 'or unusual input patterns your algorithm does not handle.',
      nextStep:    'Consider: What happens with negative numbers? Empty inputs? Duplicate values? '
                 + 'Single-element arrays? Very large or very small values? '
                 + 'Walk through your logic with edge cases before resubmitting.',
    };
  }

  // ── Check for off-by-one / boundary patterns in visible failed cases ──
  const offByOneCount = countOffByOneFailures(visibleResults, suite);
  if (offByOneCount > 0 && offByOneCount >= visibleFailed) {
    return {
      category:    'BOUNDARY_ERROR',
      label:       'Off-by-One / Boundary Error',
      explanation: `${offByOneCount} failed test${offByOneCount > 1 ? 's' : ''} produced output `
                 + 'that differs from the expected answer by exactly one. This is typically '
                 + 'caused by an incorrect loop bound, an inclusive/exclusive range mistake, '
                 + 'or indexing from 0 vs 1.',
      nextStep:    'Review your loop conditions (< vs <=, > vs >=). Check whether you are '
                 + 'using 0-indexed or 1-indexed positions consistently.',
    };
  }

  // ── Check for formatting issues (actual looks numerically correct) ──
  const formatIssueCount = countFormatMismatches(visibleResults, suite);
  if (formatIssueCount > 0 && formatIssueCount >= visibleFailed && visibleFailed > 0) {
    return {
      category:    'OUTPUT_FORMAT_ERROR',
      label:       'Output Formatting Mismatch',
      explanation: 'Your outputs appear to contain the correct values but in the wrong format. '
                 + 'Common causes: extra spaces, missing brackets, wrong delimiter, or '
                 + 'trailing newlines.',
      nextStep:    'Compare your output format carefully with the expected output. Pay attention '
                 + 'to brackets, commas, spaces, and letter case.',
    };
  }

  // ── Pattern 2: Some visible pass, some fail → Partial logic error ──
  if (visiblePassed > 0 && visibleFailed > 0) {
    return {
      category:    'PARTIAL_LOGIC_ERROR',
      label:       'Partial Logic Error',
      explanation: `Your solution passes ${visiblePassed} of ${visibleResults.length} visible tests `
                 + `but fails ${visibleFailed}. Your general approach may be correct, but it `
                 + 'does not handle all input patterns.',
      nextStep:    'Compare the passing and failing test cases above. What is different about '
                 + 'the failing inputs? Trace your algorithm step by step with a failing sample.',
    };
  }

  // ── Pattern 3: All/most tests fail → Fundamental logic error ──
  if (passedCount === 0) {
    return {
      category:    'LOGIC_ERROR',
      label:       'Incorrect Algorithm or Logic',
      explanation: "No test cases passed. The solution's core approach or implementation "
                 + 'does not produce correct results.',
      nextStep:    'Re-read the problem statement carefully. Verify your understanding of the '
                 + 'required input/output. Try solving a sample case by hand, then compare '
                 + 'each step to your code.',
    };
  }

  if (visibleFailed > 0) {
    return {
      category:    'LOGIC_ERROR',
      label:       'Incorrect Algorithm or Logic',
      explanation: `Only ${passedCount} of ${totalCount} tests passed. The solution's logic `
                 + 'has fundamental issues affecting most inputs.',
      nextStep:    'Check the failing visible test case above. Trace your code line by line '
                 + 'with that input and find where the actual output diverges from expected.',
    };
  }

  return {
    category:    'UNKNOWN',
    label:       'Unable to Determine Cause',
    explanation: 'The submission did not pass, but the failure pattern does not match '
               + 'a known mistake category.',
    nextStep:    'Review the test case results above and trace your logic manually.',
  };
}


// ─── Helper heuristics ──────────────────────────────────────────────────────

/**
 * Count how many visible failed tests have a numeric output that is
 * exactly ±1 from the expected numeric output.
 */
function countOffByOneFailures(visibleResults, suite) {
  let count = 0;
  for (const r of visibleResults) {
    if (r.passed) continue;
    const expected = suite.expectedOutputs[r.id];
    const actual   = r.actualOutput;
    if (expected == null || actual == null) continue;

    const expNum = Number(expected);
    const actNum = Number(actual);
    if (!isNaN(expNum) && !isNaN(actNum) && Math.abs(expNum - actNum) === 1) {
      count++;
    }
  }
  return count;
}

/**
 * Detect outputs that contain the right digits/values but wrong formatting.
 * e.g. expected "[0, 1]" but got "0 1" or "(0,1)".
 */
function countFormatMismatches(visibleResults, suite) {
  let count = 0;
  for (const r of visibleResults) {
    if (r.passed) continue;
    const expected = suite.expectedOutputs[r.id];
    const actual   = r.actualOutput;
    if (expected == null || actual == null) continue;

    // Extract only digits and minus signs, compare
    const expDigits = expected.replace(/[^0-9\-]/g, '|').split('|').filter(Boolean).join(',');
    const actDigits = actual.replace(/[^0-9\-]/g, '|').split('|').filter(Boolean).join(',');

    if (expDigits.length > 0 && expDigits === actDigits) {
      count++;
    }
  }
  return count;
}


module.exports = { diagnose };
