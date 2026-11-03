// Automated Test Suite for AdaptiveDSA Rule-Based Learning Engine
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

// Import modules
const {
  getTopicStats,
  getOverallMetrics,
  getAdaptiveRecommendation
} = await import('./src/services/adaptiveEngine.js');

const {
  recordAttempt,
  getSolvedProblems,
  getAttempts,
  unlockNextHint,
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

console.log('--- Starting AdaptiveDSA Rule-Based Engine Tests ---\n');

// TEST 1: New-User Behaviour (Empty State)
test('1. New user empty state has insufficient evidence and beginner recommendation', () => {
  clearAllProgress();
  const metrics = getOverallMetrics();
  if (metrics.uniqueSolved !== 0) throw new Error(`Expected 0 solved, got ${metrics.uniqueSolved}`);
  if (metrics.totalAttempts !== 0) throw new Error(`Expected 0 attempts, got ${metrics.totalAttempts}`);
  if (metrics.overallAccuracy !== 0) throw new Error(`Expected 0 accuracy, got ${metrics.overallAccuracy}`);

  const topicStats = getTopicStats();
  topicStats.forEach(t => {
    if (t.evidenceLevel !== 'insufficient') {
      throw new Error(`Expected insufficient evidence for ${t.topic}, got ${t.evidenceLevel}`);
    }
    if (t.evidenceLabel !== 'Not enough data') {
      throw new Error(`Expected 'Not enough data', got ${t.evidenceLabel}`);
    }
  });

  const rec = getAdaptiveRecommendation();
  if (!rec || !rec.problem) throw new Error('Recommendation returned null');
  if (rec.badge !== 'Beginner Baseline') throw new Error(`Expected 'Beginner Baseline', got ${rec.badge}`);
  if (!rec.reason.includes('You have not started practising yet')) {
    throw new Error(`Unexpected reason: ${rec.reason}`);
  }
  if (!rec.whyThisProblem) throw new Error('Missing whyThisProblem explanation');
});

// TEST 2: Evidence Thresholds (1 attempt, 2 attempts, 3 attempts)
test('2. Evidence threshold transitions from early estimate to established', () => {
  clearAllProgress();
  // 1 attempt in Arrays
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 1
  });

  let stats = getTopicStats().find(t => t.topic === 'Arrays');
  if (stats.evidenceLevel !== 'early') throw new Error(`Expected 'early', got ${stats.evidenceLevel}`);
  if (stats.evidenceLabel !== 'Early estimate (1 attempt)') throw new Error(`Unexpected label: ${stats.evidenceLabel}`);

  // 2nd attempt in Arrays
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 2
  });
  stats = getTopicStats().find(t => t.topic === 'Arrays');
  if (stats.evidenceLevel !== 'early') throw new Error(`Expected 'early' on 2 attempts, got ${stats.evidenceLevel}`);
  if (stats.evidenceLabel !== 'Early estimate (2 attempts)') throw new Error(`Unexpected label: ${stats.evidenceLabel}`);

  // 3rd attempt in Arrays
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 2
  });
  stats = getTopicStats().find(t => t.topic === 'Arrays');
  if (stats.evidenceLevel !== 'established') throw new Error(`Expected 'established' on 3 attempts, got ${stats.evidenceLevel}`);
  if (!stats.evidenceLabel.includes('Established (3 attempts)')) throw new Error(`Unexpected label: ${stats.evidenceLabel}`);
});

// TEST 3: Duplicate Solves Do Not Inflate Unique Solved Count
test('3. Repeated solves do not inflate unique solved count', () => {
  clearAllProgress();
  recordAttempt({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0
  });

  let solved = getSolvedProblems();
  if (solved.length !== 1) throw new Error(`Expected 1 solved problem, got ${solved.length}`);

  // Solve the SAME problem again
  recordAttempt({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0
  });

  solved = getSolvedProblems();
  if (solved.length !== 1) throw new Error(`Duplicate solve inflated count! Expected 1, got ${solved.length}`);

  const attempts = getAttempts();
  if (attempts.length !== 2) throw new Error(`Expected 2 logged attempts, got ${attempts.length}`);
});

// TEST 4: Recent Topic Struggle / Failed Attempts Remediation Rule
test('4. Two recent failed attempts in a topic trigger Targeted Remediation', () => {
  clearAllProgress();
  // Record 2 failed attempts in Strings
  recordAttempt({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 2
  });
  recordAttempt({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 3
  });

  const rec = getAdaptiveRecommendation();
  if (rec.badge !== 'Targeted Remediation') {
    throw new Error(`Expected 'Targeted Remediation', got '${rec.badge}'`);
  }
  if (!rec.reason.includes('struggled with 2 recent strings attempts')) {
    throw new Error(`Reason does not match expected struggle message: ${rec.reason}`);
  }
  if (rec.problem.topic !== 'Strings') {
    throw new Error(`Expected recommendation in Strings topic, got ${rec.problem.topic}`);
  }
});

// TEST 5: Autonomy Streak Advances Difficulty
test('5. Two consecutive zero-hint solves recommend a harder problem', () => {
  clearAllProgress();
  // Solve 2 problems with 0 hints
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0
  });
  recordAttempt({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0
  });

  const rec = getAdaptiveRecommendation();
  if (rec.badge !== 'Challenge Advance') {
    throw new Error(`Expected 'Challenge Advance', got '${rec.badge}'`);
  }
  if (!rec.reason.includes('solved your last two problems without hints')) {
    throw new Error(`Unexpected reason: ${rec.reason}`);
  }
  if (rec.problem.difficulty !== 'Medium') {
    throw new Error(`Expected Medium difficulty problem, got ${rec.problem.difficulty}`);
  }
});

// TEST 6: Unpracticed Topic Exploration Rule
test('6. Unpracticed topic is recommended when other topics have attempts', () => {
  clearAllProgress();
  // Attempt Arrays and Strings with hints (so not 0-hint streak)
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 1
  });

  const rec = getAdaptiveRecommendation();
  // Next topic unpracticed (Binary Search, Linked Lists, etc.)
  if (rec.badge !== 'Topic Exploration' && rec.badge !== 'Mastery Calibration') {
    throw new Error(`Expected 'Topic Exploration' or 'Mastery Calibration', got '${rec.badge}'`);
  }
  if (!rec.whyThisProblem) {
    throw new Error('Missing whyThisProblem explanation');
  }
});

// TEST 7: All Problems Solved Case (Revision Rule)
test('7. When all problems in curriculum are solved, recommends revision of high-hint problem', () => {
  clearAllProgress();
  // Mark all problems solved
  PROBLEMS.forEach((p, idx) => {
    // Unlock 3 hints on binary-search specifically
    const hints = p.id === 'binary-search' ? 3 : 1;
    for (let h = 0; h < hints; h++) {
      unlockNextHint(p.id);
    }
    recordAttempt({
      problemId: p.id,
      problemTitle: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      success: true,
      hintsUnlocked: hints
    });
  });

  const solved = getSolvedProblems();
  if (solved.length !== PROBLEMS.length) {
    throw new Error(`Expected ${PROBLEMS.length} solved, got ${solved.length}`);
  }

  const rec = getAdaptiveRecommendation();
  if (!rec || !rec.problem) throw new Error('Recommendation was null');
  if (!rec.badge.includes('Revision')) throw new Error(`Expected Revision badge, got ${rec.badge}`);
  if (!rec.reason.includes(`solved all ${PROBLEMS.length} problems`)) throw new Error(`Unexpected reason: ${rec.reason}`);
  if (rec.problem.id !== 'binary-search') {
    throw new Error(`Expected revision of highest-hint problem 'binary-search', got ${rec.problem.id}`);
  }
});

console.log('\n--- Test Summary ---');
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`Passed: ${passed}/${total}`);

if (passed !== total) {
  process.exit(1);
} else {
  console.log('All adaptive engine verification checks PASSED successfully!');
}
