// Automated Test Suite for Personalized Next-Problem Recommendation
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

const { getAdaptiveRecommendation, getTopicStats } = await import('./src/services/adaptiveEngine.js');
const { recordAttempt, clearAllProgress, getSolvedProblems } = await import('./src/services/storage.js');
const { scheduleInitialRevision, saveRevisions, getRevisions } = await import('./src/services/revisionService.js');

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

console.log('--- Starting Personalized Next-Problem Recommendation Tests ---\n');

// TEST 1: Empty History
test('1. Empty history recommends beginner problem without fabricated evidence', () => {
  clearAllProgress();
  const rec = getAdaptiveRecommendation();

  if (!rec || !rec.problem) {
    throw new Error('Expected recommendation object with problem');
  }
  if (rec.badge !== 'Beginner Baseline') {
    throw new Error(`Expected badge 'Beginner Baseline', got '${rec.badge}'`);
  }
  if (rec.problem.difficulty !== 'Easy') {
    throw new Error(`Expected beginner problem with Easy difficulty, got '${rec.problem.difficulty}'`);
  }
  if (rec.isRevision) {
    throw new Error('New user recommendation should not be a revision');
  }
  if (!rec.reason || !rec.whyThisProblem) {
    throw new Error('Recommendation must have reason and whyThisProblem');
  }
});

// TEST 2: Weak-Topic Recommendation (Knowledge Gap)
test('2. Prioritizes weak topic when repeated mistakes indicate a knowledge gap', () => {
  clearAllProgress();

  // Record 2 failed attempts in Binary Search
  recordAttempt({
    problemId: 'binary-search',
    problemTitle: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 2
  });
  recordAttempt({
    problemId: 'binary-search',
    problemTitle: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 3
  });

  const rec = getAdaptiveRecommendation();
  if (rec.badge !== 'Targeted Remediation') {
    throw new Error(`Expected 'Targeted Remediation', got '${rec.badge}'`);
  }
  if (rec.problem.topic !== 'Binary Search') {
    throw new Error(`Expected recommendation in 'Binary Search', got '${rec.problem.topic}'`);
  }
  if (!rec.reason.toLowerCase().includes('binary search')) {
    throw new Error(`Reason should mention binary search: ${rec.reason}`);
  }
  if (rec.isRevision) {
    throw new Error('Remediation on unsolved problem should not be marked as revision');
  }
});

// TEST 3: Due Revisions
test('3. Recommends revision when a previously solved problem is due for review', () => {
  clearAllProgress();
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // User solved two-sum
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0
  });

  // Manually set two-sum due date to 2 days in the past (overdue)
  const revisions = getRevisions();
  revisions['two-sum'] = {
    problemId: 'two-sum',
    stage: 1,
    intervalDays: 1,
    lastReviewedAt: new Date(now - 3 * dayMs).toISOString(),
    dueDate: new Date(now - 2 * dayMs).toISOString(),
    history: []
  };
  saveRevisions(revisions);

  const rec = getAdaptiveRecommendation();
  if (rec.badge !== 'Spaced Revision Due') {
    throw new Error(`Expected badge 'Spaced Revision Due', got '${rec.badge}'`);
  }
  if (rec.problem.id !== 'two-sum') {
    throw new Error(`Expected overdue problem 'two-sum', got '${rec.problem.id}'`);
  }
  if (!rec.isRevision) {
    throw new Error('Expected isRevision flag to be true');
  }
  if (!rec.reason.includes('overdue')) {
    throw new Error(`Expected reason to mention overdue: ${rec.reason}`);
  }
});

// TEST 4: Mastered Problems Avoidance
test('4. Avoids recommending a mastered problem unless revision is due', () => {
  clearAllProgress();
  const dayMs = 24 * 60 * 60 * 1000;

  // Solve two-sum successfully with 1 hint
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 1
  });

  // Ensure two-sum is scheduled for future review (1 day ahead, NOT due yet)
  const solved = getSolvedProblems();
  if (!solved.includes('two-sum')) {
    throw new Error('two-sum should be in solved list');
  }

  const rec = getAdaptiveRecommendation();
  // Must NOT recommend two-sum since it is mastered and NOT due
  if (rec.problem.id === 'two-sum') {
    throw new Error('Engine recommended an already-mastered problem that is not due for revision!');
  }
  // Must recommend an unsolved problem
  if (solved.includes(rec.problem.id)) {
    throw new Error(`Engine recommended already-solved problem '${rec.problem.id}'`);
  }
});

console.log(`\n--- Test Summary ---`);
const passedCount = results.filter(r => r.passed).length;
console.log(`Passed: ${passedCount}/${results.length}`);
if (passedCount === results.length) {
  console.log('All Personalized Recommendation tests PASSED successfully!');
} else {
  process.exit(1);
}
