// Test Suite for Mistake Pattern Analysis & Aggregation
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

const { getMistakePatternStats } = await import('./src/services/adaptiveEngine.js');
const { recordAttempt, clearAllProgress } = await import('./src/services/storage.js');

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

console.log('--- Starting Mistake Pattern Analysis Tests ---\n');

// TEST 1: Empty state
test('1. Empty attempts history returns hasData=false', () => {
  clearAllProgress();
  const stats = getMistakePatternStats();
  if (stats.hasData !== false) throw new Error(`Expected hasData=false, got ${stats.hasData}`);
  if (stats.totalDiagnosed !== 0) throw new Error(`Expected totalDiagnosed=0, got ${stats.totalDiagnosed}`);
  if (stats.categories.length !== 0) throw new Error(`Expected 0 categories, got ${stats.categories.length}`);
});

// TEST 2: Aggregates automated failures and ignores successful attempts
test('2. Accurately aggregates failed attempts with diagnoses', () => {
  clearAllProgress();
  
  // Record success (should be ignored by mistake pattern stats)
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    evaluationType: 'automated',
    status: 'ACCEPTED'
  });

  // Record 2 Boundary errors on binary-search
  recordAttempt({
    problemId: 'binary-search',
    problemTitle: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    success: false,
    evaluationType: 'automated',
    status: 'WRONG_ANSWER',
    diagnosisCategory: 'BOUNDARY_ERROR'
  });
  recordAttempt({
    problemId: 'binary-search',
    problemTitle: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    success: false,
    evaluationType: 'automated',
    status: 'WRONG_ANSWER',
    diagnosisCategory: 'BOUNDARY_ERROR'
  });

  // Record 1 Compilation error on valid-parentheses
  recordAttempt({
    problemId: 'valid-parentheses',
    problemTitle: 'Valid Parentheses',
    topic: 'Stacks',
    difficulty: 'Easy',
    success: false,
    evaluationType: 'automated',
    status: 'COMPILATION_ERROR',
    diagnosisCategory: 'COMPILATION_ERROR'
  });

  const stats = getMistakePatternStats();
  if (stats.hasData !== true) throw new Error(`Expected hasData=true, got ${stats.hasData}`);
  if (stats.totalDiagnosed !== 3) throw new Error(`Expected totalDiagnosed=3, got ${stats.totalDiagnosed}`);
  if (stats.categories.length !== 2) throw new Error(`Expected 2 categories, got ${stats.categories.length}`);

  // Top category should be BOUNDARY_ERROR (2 / 3 = 67%)
  const top = stats.categories[0];
  if (top.category !== 'BOUNDARY_ERROR') throw new Error(`Expected top category BOUNDARY_ERROR, got ${top.category}`);
  if (top.count !== 2) throw new Error(`Expected count=2, got ${top.count}`);
  if (top.percentage !== 67) throw new Error(`Expected percentage=67, got ${top.percentage}`);
  if (top.affectedProblems !== 1) throw new Error(`Expected affectedProblems=1, got ${top.affectedProblems}`);

  // Second category should be COMPILATION_ERROR (1 / 3 = 33%)
  const second = stats.categories[1];
  if (second.category !== 'COMPILATION_ERROR') throw new Error(`Expected second category COMPILATION_ERROR, got ${second.category}`);
  if (second.count !== 1) throw new Error(`Expected count=1, got ${second.count}`);
  if (second.percentage !== 33) throw new Error(`Expected percentage=33, got ${second.percentage}`);

  // Should generate actionable insight
  if (!stats.insight || !stats.insight.title) {
    throw new Error('Expected actionable insight to be generated');
  }
});

console.log(`\n--- Test Summary ---`);
const passedCount = results.filter(r => r.passed).length;
console.log(`Passed: ${passedCount}/${results.length}`);
if (passedCount === results.length) {
  console.log('All Mistake Pattern Analysis tests PASSED successfully!');
} else {
  process.exit(1);
}
