// Automated Test Suite for Adaptive Revision and Retention System
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
  getRevisions,
  saveRevisions,
  scheduleInitialRevision,
  recordRevisionOutcome,
  getRevisionPipeline,
  SPACED_INTERVALS
} = await import('./src/services/revisionService.js');

const {
  recordAttempt,
  getSolvedProblems,
  getAttempts,
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

console.log('--- Starting Adaptive Revision & Retention System Tests ---\n');

// TEST 1: Auto-scheduling newly solved problems into spaced repetition pipeline
test('1. Newly solved problem is scheduled for Stage 1 (1-day interval)', () => {
  clearAllProgress();
  
  // Mark problem solved
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0
  });

  const revisions = getRevisions();
  const entry = revisions['two-sum'];
  if (!entry) throw new Error('Expected two-sum to be scheduled in revisions map');
  if (entry.stage !== 1) throw new Error(`Expected stage 1, got ${entry.stage}`);
  if (entry.intervalDays !== 1) throw new Error(`Expected 1 day interval, got ${entry.intervalDays}`);
  
  const due = new Date(entry.dueDate).getTime();
  const now = Date.now();
  const diffDays = Math.round((due - now) / 86400000);
  if (diffDays !== 1) throw new Error(`Expected due in 1 day, got ${diffDays}`);
});

// TEST 2: Pre-existing solved problems enrolled safely
test('2. Pre-existing solved problems without revision entries are safely auto-enrolled', () => {
  clearAllProgress();
  // Simulate pre-existing solved list in storage without revisions map
  localStorage.setItem('adaptivedsa_solved_ids', JSON.stringify(['valid-anagram', 'binary-search']));
  
  const revisions = getRevisions();
  if (!revisions['valid-anagram']) throw new Error('valid-anagram was not auto-enrolled');
  if (!revisions['binary-search']) throw new Error('binary-search was not auto-enrolled');
  if (revisions['valid-anagram'].stage !== 1) throw new Error('Expected Stage 1 initial schedule');
});

// TEST 3: Spaced repetition progression on independent solve
test('3. Independent recall advances stages: 1d -> 3d -> 7d -> 14d -> 30d', () => {
  clearAllProgress();
  scheduleInitialRevision('two-sum');

  // Stage 1 -> 2 (3 days)
  let entry = recordRevisionOutcome('two-sum', 'independent');
  if (entry.stage !== 2) throw new Error(`Expected stage 2, got ${entry.stage}`);
  if (entry.intervalDays !== 3) throw new Error(`Expected 3 days, got ${entry.intervalDays}`);

  // Stage 2 -> 3 (7 days)
  entry = recordRevisionOutcome('two-sum', 'independent');
  if (entry.stage !== 3) throw new Error(`Expected stage 3, got ${entry.stage}`);
  if (entry.intervalDays !== 7) throw new Error(`Expected 7 days, got ${entry.intervalDays}`);

  // Stage 3 -> 4 (14 days)
  entry = recordRevisionOutcome('two-sum', 'independent');
  if (entry.stage !== 4) throw new Error(`Expected stage 4, got ${entry.stage}`);
  if (entry.intervalDays !== 14) throw new Error(`Expected 14 days, got ${entry.intervalDays}`);

  // Stage 4 -> 5 (30 days)
  entry = recordRevisionOutcome('two-sum', 'independent');
  if (entry.stage !== 5) throw new Error(`Expected stage 5, got ${entry.stage}`);
  if (entry.intervalDays !== 30) throw new Error(`Expected 30 days, got ${entry.intervalDays}`);

  // Stage 5 -> cap at 5 (30 days)
  entry = recordRevisionOutcome('two-sum', 'independent');
  if (entry.stage !== 5) throw new Error(`Expected stage cap 5, got ${entry.stage}`);
  if (entry.intervalDays !== 30) throw new Error(`Expected 30 days, got ${entry.intervalDays}`);
});

// TEST 4: Demotion on hint usage
test('4. Solving with hints drops back to Stage 1 (1-day retry) for prompt reinforcement', () => {
  clearAllProgress();
  scheduleInitialRevision('two-sum');

  // Advance to Stage 3
  recordRevisionOutcome('two-sum', 'independent'); // stage 2
  recordRevisionOutcome('two-sum', 'independent'); // stage 3
  
  let entry = getRevisions()['two-sum'];
  if (entry.stage !== 3) throw new Error(`Expected stage 3, got ${entry.stage}`);

  // Now review with hints
  entry = recordRevisionOutcome('two-sum', 'with_hints');
  if (entry.stage !== 1) throw new Error(`Expected reset to stage 1 on hint usage, got ${entry.stage}`);
  if (entry.intervalDays !== 1) throw new Error(`Expected 1-day interval, got ${entry.intervalDays}`);
});

// TEST 5: Reset on failed revision
test('5. Failing a revision resets to Stage 1 (1-day retry)', () => {
  clearAllProgress();
  scheduleInitialRevision('two-sum');
  recordRevisionOutcome('two-sum', 'independent'); // stage 2
  
  let entry = recordRevisionOutcome('two-sum', 'failed');
  if (entry.stage !== 1) throw new Error(`Expected stage 1 on failure, got ${entry.stage}`);
  if (entry.intervalDays !== 1) throw new Error(`Expected 1 day on failure, got ${entry.intervalDays}`);
});

// TEST 6: Overdue reviews calculation and future scheduling
test('6. Overdue reviews are detected correctly and future scheduling calculates from current date', () => {
  clearAllProgress();
  const dayMs = 86400000;
  const now = Date.now();
  
  // Set an overdue revision (due 3 days ago)
  const pastDue = new Date(now - 3 * dayMs).toISOString();
  saveRevisions({
    'two-sum': {
      problemId: 'two-sum',
      stage: 1,
      intervalDays: 1,
      lastReviewedAt: new Date(now - 4 * dayMs).toISOString(),
      dueDate: pastDue,
      history: []
    }
  });

  let pipeline = getRevisionPipeline();
  if (pipeline.overdue.length !== 1) throw new Error(`Expected 1 overdue review, got ${pipeline.overdue.length}`);
  if (pipeline.overdue[0].daysOverdue < 2) {
    throw new Error(`Expected at least 2 days overdue, got ${pipeline.overdue[0].daysOverdue}`);
  }

  // Complete the overdue review independently
  const updated = recordRevisionOutcome('two-sum', 'independent');
  const nextDueDate = new Date(updated.dueDate).getTime();
  
  // Next due date must be 3 days from NOW, not 3 days from the past overdue date!
  const diffFromNow = Math.round((nextDueDate - now) / dayMs);
  if (diffFromNow !== 3) {
    throw new Error(`Expected next due date in 3 days from today, got diff of ${diffFromNow} days`);
  }
});

// TEST 7: Retention metric calculation and pipeline integrity
test('7. Retention metric is calculated accurately based on actual recall outcomes', () => {
  clearAllProgress();
  scheduleInitialRevision('two-sum');
  scheduleInitialRevision('valid-anagram');

  // Outcome 1: independent solve on two-sum
  recordRevisionOutcome('two-sum', 'independent');
  // Outcome 2: solve with hints on valid-anagram
  recordRevisionOutcome('valid-anagram', 'with_hints');

  const pipeline = getRevisionPipeline();
  if (pipeline.totalRevisionsCompleted !== 2) {
    throw new Error(`Expected 2 completed revisions, got ${pipeline.totalRevisionsCompleted}`);
  }
  if (pipeline.independentSolves !== 1) {
    throw new Error(`Expected 1 independent solve, got ${pipeline.independentSolves}`);
  }
  // 1 / 2 = 50%
  if (pipeline.recallRetentionRate !== 50) {
    throw new Error(`Expected 50% recall retention rate, got ${pipeline.recallRetentionRate}%`);
  }

  // Ensure unique solved count is NOT inflated
  const solved = getSolvedProblems();
  // We never called recordAttempt success directly in this test, so unique solved should not be duplicated
  const uniqueCount = new Set(solved).size;
  if (uniqueCount !== solved.length) {
    throw new Error('Duplicate solved problem IDs detected');
  }
});

console.log('\n--- Revision System Test Summary ---');
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`Passed: ${passed}/${total}`);

if (passed !== total) {
  process.exit(1);
} else {
  console.log('All revision and retention system checks PASSED successfully!');
}
