// Automated Test Suite for Blind Solve Challenge Mode
import { PROBLEMS } from './src/data/problems.js';

// Polyfill minimal browser localStorage and Event
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

global.window = {
  dispatchEvent: () => {}
};
global.Event = class Event {};

const {
  calculateIndependenceScore,
  getActiveBlindSession,
  startBlindSession,
  incrementBlindSubmissions,
  endBlindSession,
  abandonBlindSession
} = await import('./src/services/blindSolveService.js');

const {
  recordAttempt,
  getAttempts,
  getSolvedProblems,
  isProblemSolved,
  clearAllProgress
} = await import('./src/services/storage.js');

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✓ PASS: ${name}`);
  } catch (err) {
    results.push({ name, passed: false, error: err.message });
    console.error(`✗ FAIL: ${name}: ${err.message}`);
  }
}

console.log('--- Starting Blind Solve Challenge Mode Tests ---\n');

// TEST 1: Successful Independent Solve (Pure 100 Score)
test('1. Successful independent solve earns 100/100 score and marks problem solved', () => {
  clearAllProgress();
  const problemId = 'two-sum';

  // Start blind session with 0 hints
  const session = startBlindSession(problemId, 0);
  if (!session || !session.active) throw new Error('Session did not start actively');

  // Submit once and pass
  incrementBlindSubmissions(problemId);
  const completed = endBlindSession(problemId);
  if (!completed) throw new Error('Failed to complete blind session');
  if (completed.submissionCount !== 1) throw new Error(`Expected 1 submission, got ${completed.submissionCount}`);

  // Calculate score
  const scoreResult = calculateIndependenceScore({
    success: true,
    submissionCount: completed.submissionCount,
    hintsUsed: 0
  });

  if (scoreResult.score !== 100) {
    throw new Error(`Expected perfect score 100, got ${scoreResult.score}`);
  }
  if (scoreResult.breakdown.correctness !== 70) throw new Error('Expected 70 correctness points');
  if (scoreResult.breakdown.attemptsBonus !== 20) throw new Error('Expected 20 single-attempt bonus');
  if (scoreResult.breakdown.autonomyBonus !== 10) throw new Error('Expected 10 zero-hint autonomy bonus');
  if (!scoreResult.disclaimer || !scoreResult.explanation) throw new Error('Missing disclaimer or explanation');

  // Record attempt in storage
  recordAttempt({
    problemId,
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0,
    code: 'int main() {}',
    evaluationType: 'automated',
    status: 'ACCEPTED',
    isBlindSolve: true,
    blindSolveTimeSeconds: completed.elapsedSeconds,
    independenceScore: scoreResult.score
  });

  if (!isProblemSolved(problemId)) {
    throw new Error('Problem should be marked solved');
  }

  const att = getAttempts()[0];
  if (!att.isBlindSolve) throw new Error('Attempt should have isBlindSolve=true');
  if (att.independenceScore !== 100) throw new Error(`Expected score 100 in attempt, got ${att.independenceScore}`);
});

// TEST 2: Failed Attempts in Blind Mode
test('2. Failed blind attempt records incomplete attempt with 0 score without marking solved', () => {
  clearAllProgress();
  const problemId = 'binary-search';

  startBlindSession(problemId, 0);
  incrementBlindSubmissions(problemId);

  // Failed evaluation
  const scoreResult = calculateIndependenceScore({
    success: false,
    submissionCount: 1,
    hintsUsed: 0
  });

  if (scoreResult.score !== 0) {
    throw new Error(`Failed attempt should have 0 score, got ${scoreResult.score}`);
  }

  recordAttempt({
    problemId,
    problemTitle: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 0,
    status: 'WRONG_ANSWER',
    evaluationType: 'automated',
    isBlindSolve: true,
    blindSolveTimeSeconds: 45,
    independenceScore: 0
  });

  if (isProblemSolved(problemId)) {
    throw new Error('Failed attempt must NOT mark problem as solved');
  }
  const solvedList = getSolvedProblems();
  if (solvedList.includes(problemId)) {
    throw new Error('Solved list should not contain binary-search');
  }
});

// TEST 3: Hint Usage Reduces Autonomy Score
test('3. Hint usage transparently reduces independence score breakdown', () => {
  // Scenario A: 2 submissions with 1 hint used
  const res1 = calculateIndependenceScore({
    success: true,
    submissionCount: 2,
    hintsUsed: 1
  });
  // 70 (correctness) + 15 (2 submissions) + 5 (1 hint) = 90
  if (res1.score !== 90) {
    throw new Error(`Expected score 90 for 2 submissions and 1 hint, got ${res1.score}`);
  }
  if (res1.breakdown.autonomyBonus !== 5) {
    throw new Error(`Expected 5 autonomy bonus for 1 hint, got ${res1.breakdown.autonomyBonus}`);
  }

  // Scenario B: 4 submissions with 3 hints used
  const res2 = calculateIndependenceScore({
    success: true,
    submissionCount: 4,
    hintsUsed: 3
  });
  // 70 (correctness) + 5 (4 submissions) + 0 (3 hints) = 75
  if (res2.score !== 75) {
    throw new Error(`Expected score 75 for 4 submissions and 3 hints, got ${res2.score}`);
  }
  if (res2.breakdown.autonomyBonus !== 0) {
    throw new Error(`Expected 0 autonomy bonus for 3 hints, got ${res2.breakdown.autonomyBonus}`);
  }
});

// TEST 4: Abandoned Sessions and Page Refreshes
test('4. Active session survives simulated refresh and abandon never marks solved', () => {
  clearAllProgress();
  const problemId = 'valid-parentheses';

  // Start challenge session
  const created = startBlindSession(problemId, 0);
  incrementBlindSubmissions(problemId);

  // Simulate page refresh: read session from storage
  const restored = getActiveBlindSession(problemId);
  if (!restored) throw new Error('Active session was not restored after simulated refresh');
  if (restored.submissionCount !== 1) {
    throw new Error(`Expected submissionCount 1 on restored session, got ${restored.submissionCount}`);
  }
  if (restored.startTime !== created.startTime) {
    throw new Error('Start time should be preserved across refreshes');
  }

  // User decides to abandon challenge
  const abandoned = abandonBlindSession(problemId);
  if (!abandoned || !abandoned.abandoned) throw new Error('Session was not marked abandoned');

  // Verify session is no longer active in storage
  const activeAfterAbandon = getActiveBlindSession(problemId);
  if (activeAfterAbandon !== null) {
    throw new Error('Active session should be null after abandonment');
  }

  // Crucial: verify problem was NEVER marked as solved
  if (isProblemSolved(problemId)) {
    throw new Error('Abandoned session must NEVER mark problem as solved!');
  }
  if (getSolvedProblems().includes(problemId)) {
    throw new Error('Solved problems array should remain empty');
  }
});

console.log(`\n--- Test Summary ---`);
const passedCount = results.filter(r => r.passed).length;
console.log(`Passed: ${passedCount}/${results.length}`);
if (passedCount === results.length) {
  console.log('All Blind Solve Challenge Mode tests PASSED successfully!');
} else {
  process.exit(1);
}
