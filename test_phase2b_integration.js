/**
 * test_phase2b_integration.js
 *
 * Automated Test Suite for Phase 2B:
 *  - Assessment Persistence (save, retrieve, filter by problem)
 *  - De-duplication on repeated renders / identical assessment IDs
 *  - Malformed and missing localStorage safety
 *  - Problem isolation (no cross-problem contamination)
 *  - Recommendation integration (Rule 4B cognitive gaps & guarded difficulty advance)
 *  - Reflection draft persistence
 */

// Polyfill minimal browser localStorage and window Event
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
  getUnderstandingAssessments,
  getLatestAssessment,
  saveUnderstandingAssessment,
  getReflectionDraft,
  saveReflectionDraft,
  clearAllProgress,
  recordAttempt
} = await import('./src/services/storage.js');

const {
  assessProblemSolving,
  getProblemComprehensionCheck
} = await import('./src/services/intelligenceEngine.js');

const {
  getAdaptiveRecommendation
} = await import('./src/services/adaptiveEngine.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

console.log('--- Starting Phase 2B Integration & Persistence Tests ---\n');

// ─── SUITE 1: Assessment Persistence ─────────────────────────────────────────
console.log('[Suite 1: Assessment Persistence & Storage Schemas]');

it('Persists full assessment object and retrieves with all 5 dimensions', () => {
  clearAllProgress();

  const assessment = assessProblemSolving({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    evidence: {
      submissionStatus: 'ACCEPTED',
      testsPassed: 4,
      totalTests: 4,
      executionTimeMs: 410,
      attemptCount: 1,
      hintsUnlocked: 0,
      statedTimeComplexity: 'O(n)',
      statedSpaceComplexity: 'O(n)',
      complexityReasoning: 'Single pass with hash map lookup.',
      approachExplanation: 'Stored complements in unordered_map.'
    }
  });

  saveUnderstandingAssessment(assessment);

  const stored = getUnderstandingAssessments('two-sum');
  assert(stored.length === 1, `Expected 1 stored assessment, got ${stored.length}`);
  const record = stored[0];

  assert(record.assessmentId === assessment.assessmentId, 'Assessment IDs must match');
  assert(record.problemId === 'two-sum', 'Problem ID must match');
  assert(record.dimensions.implementationAbility.score === 100, 'Implementation score must be 100');
  assert(record.dimensions.independence.score === 100, 'Independence score must be 100');
  assert(record.dimensions.complexityAnalysis.score >= 90, 'Complexity score must be >= 90');
  assert(record.dimensions.conceptualUnderstanding.score >= 70, 'Conceptual score must be >= 70');
  assert(record.dimensions.algorithmSelection.score >= 80, 'Algorithm score must be >= 80');
  assert(record.overallSummary.compositeScore >= 80, 'Composite score must be >= 80');
  assert(typeof record.disclaimer === 'string', 'Disclaimer must be stored');
});

it('getLatestAssessment returns the most recent record for a problem', () => {
  clearAllProgress();

  const ass1 = assessProblemSolving({
    problemId: 'two-sum',
    evidence: { submissionStatus: 'WRONG_ANSWER', testsPassed: 1, totalTests: 4 }
  });
  ass1.assessmentId = 'ass_1';
  saveUnderstandingAssessment(ass1);

  const ass2 = assessProblemSolving({
    problemId: 'two-sum',
    evidence: { submissionStatus: 'ACCEPTED', testsPassed: 4, totalTests: 4 }
  });
  ass2.assessmentId = 'ass_2';
  saveUnderstandingAssessment(ass2);

  const latest = getLatestAssessment('two-sum');
  assert(latest !== null, 'Latest assessment should not be null');
  assert(latest.assessmentId === 'ass_2', `Expected latest assessment to be ass_2, got ${latest.assessmentId}`);
  assert(latest.dimensions.implementationAbility.score === 100, 'Latest implementation score should be 100');
});

// ─── SUITE 2: De-duplication and Repeated Renders ─────────────────────────────
console.log('\n[Suite 2: De-duplication and Repeated Renders]');

it('Prevents duplicate records when saving identical assessmentId multiple times', () => {
  clearAllProgress();

  const assessment = assessProblemSolving({
    problemId: 'valid-anagram',
    evidence: { submissionStatus: 'ACCEPTED', testsPassed: 4, totalTests: 4 }
  });

  // Simulate multiple React re-renders or repeated saves with the same ID
  saveUnderstandingAssessment(assessment);
  saveUnderstandingAssessment(assessment);
  saveUnderstandingAssessment(assessment);

  const list = getUnderstandingAssessments('valid-anagram');
  assert(list.length === 1, `Expected exactly 1 record after 3 identical saves, got ${list.length}`);
});

// ─── SUITE 3: Malformed & Missing Storage Data Safety ─────────────────────────
console.log('\n[Suite 3: Malformed & Missing Storage Safety]');

it('Gracefully handles corrupted JSON and non-array storage data', () => {
  clearAllProgress();

  // 1. Corrupted non-JSON string
  storage.set('adaptivedsa_understanding_assessments', 'NOT_VALID_JSON{:::');
  const resCorrupted = getUnderstandingAssessments();
  assert(Array.isArray(resCorrupted) && resCorrupted.length === 0, 'Should return empty array on corrupted JSON');

  // 2. Non-array primitive (e.g. integer or object string)
  storage.set('adaptivedsa_understanding_assessments', '{"notAnArray": true}');
  const resObj = getUnderstandingAssessments();
  assert(Array.isArray(resObj) && resObj.length === 0, 'Should return empty array on non-array JSON');

  // 3. Null argument to save
  const resNull = saveUnderstandingAssessment(null);
  assert(resNull === null, 'Saving null should return null safely without throwing');

  // 4. clearAllProgress removes assessments key
  storage.set('adaptivedsa_understanding_assessments', '[]');
  clearAllProgress();
  assert(storage.get('adaptivedsa_understanding_assessments') === undefined, 'clearAllProgress should remove assessments key');
});

// ─── SUITE 4: Problem Isolation ───────────────────────────────────────────────
console.log('\n[Suite 4: Problem Isolation]');

it('Assessments for one problem do not cross-contaminate another problem', () => {
  clearAllProgress();

  const assTwoSum = assessProblemSolving({
    problemId: 'two-sum',
    evidence: { submissionStatus: 'ACCEPTED', testsPassed: 4, totalTests: 4 }
  });
  saveUnderstandingAssessment(assTwoSum);

  const assAnagram = assessProblemSolving({
    problemId: 'valid-anagram',
    evidence: { submissionStatus: 'WRONG_ANSWER', testsPassed: 2, totalTests: 4 }
  });
  saveUnderstandingAssessment(assAnagram);

  const twoSumList = getUnderstandingAssessments('two-sum');
  const anagramList = getUnderstandingAssessments('valid-anagram');
  const bsList = getUnderstandingAssessments('binary-search');

  assert(twoSumList.length === 1, 'Two Sum should have 1 assessment');
  assert(twoSumList[0].problemId === 'two-sum', 'Two Sum record matches');
  assert(anagramList.length === 1, 'Valid Anagram should have 1 assessment');
  assert(anagramList[0].problemId === 'valid-anagram', 'Valid Anagram record matches');
  assert(bsList.length === 0, 'Binary search should have 0 assessments');
});

// ─── SUITE 5: Recommendation Integration (Rule 4B & Guarded Advance) ─────────
console.log('\n[Suite 5: Recommendation Integration]');

it('Recommends Complexity Reflection when implementation is accepted but complexity analysis is weak', () => {
  clearAllProgress();

  // Record an attempt for two-sum
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0,
    status: 'ACCEPTED',
    passedCount: 4,
    totalCount: 4
  });

  // Save an assessment with flawed complexity claim
  const ass = assessProblemSolving({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    evidence: {
      submissionStatus: 'ACCEPTED',
      testsPassed: 4,
      totalTests: 4,
      attemptCount: 1,
      hintsUnlocked: 0,
      statedTimeComplexity: 'O(1)', // Incorrect complexity
      statedSpaceComplexity: 'O(n^2)'
    }
  });
  saveUnderstandingAssessment(ass);

  const rec = getAdaptiveRecommendation();
  assert(rec.problem.id === 'two-sum', `Expected two-sum recommendation, got ${rec.problem.id}`);
  assert(rec.badge.includes('Complexity'), `Badge should mention complexity, got: ${rec.badge}`);
  assert(rec.targetMetric === 'Complexity Analysis', `Target metric should be Complexity Analysis, got: ${rec.targetMetric}`);
});

it('Recommends Edge-Case Debugging when conceptual reasoning is sound but code failed tests', () => {
  clearAllProgress();

  recordAttempt({
    problemId: 'best-time-to-buy-and-sell-stock',
    problemTitle: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 0,
    status: 'WRONG_ANSWER'
  });

  const ass = assessProblemSolving({
    problemId: 'best-time-to-buy-and-sell-stock',
    problemTitle: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    evidence: {
      submissionStatus: 'WRONG_ANSWER',
      testsPassed: 3,
      totalTests: 4,
      mistakeCategory: 'BOUNDARY_ERROR',
      approachExplanation: 'Track min price so far and max profit difference on each day.',
      statedTimeComplexity: 'O(n)',
      statedSpaceComplexity: 'O(1)',
      comprehensionCheck: { answered: true, isCorrect: true }
    }
  });
  saveUnderstandingAssessment(ass);

  const rec = getAdaptiveRecommendation();
  assert(rec.problem.id === 'best-time-to-buy-and-sell-stock', `Expected stock problem, got ${rec.problem.id}`);
  assert(rec.badge.includes('Edge-Case'), `Badge should mention edge-case, got: ${rec.badge}`);
  assert(rec.targetMetric === 'Edge-Case Debugging', `Target metric should be Edge-Case Debugging, got: ${rec.targetMetric}`);
});

it('Recommends Blind Solve Challenge when solve required heavy hints', () => {
  clearAllProgress();

  recordAttempt({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 3,
    status: 'ACCEPTED'
  });

  const ass = assessProblemSolving({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    evidence: {
      submissionStatus: 'ACCEPTED',
      testsPassed: 4,
      totalTests: 4,
      hintsUnlocked: 3,
      attemptCount: 3
    }
  });
  saveUnderstandingAssessment(ass);

  const rec = getAdaptiveRecommendation();
  assert(rec.problem.id === 'valid-anagram', `Expected valid-anagram, got ${rec.problem.id}`);
  assert(rec.badge.includes('Independent'), `Badge should mention independent, got: ${rec.badge}`);
  assert(rec.targetMetric === 'Autonomy Consolidation', `Target metric should be Autonomy Consolidation, got: ${rec.targetMetric}`);
});

it('Guards difficulty advance: does NOT advance to Medium if recent solve has flawed complexity reasoning', () => {
  clearAllProgress();

  // Two consecutive zero-hint solves (normally triggers advance)
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0,
    status: 'ACCEPTED'
  });
  recordAttempt({
    problemId: 'best-time-to-buy-and-sell-stock',
    problemTitle: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0,
    status: 'ACCEPTED'
  });

  // But latest solve (best-time-to-buy-and-sell-stock) has flawed complexity
  const ass = assessProblemSolving({
    problemId: 'best-time-to-buy-and-sell-stock',
    problemTitle: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    evidence: {
      submissionStatus: 'ACCEPTED',
      testsPassed: 4,
      totalTests: 4,
      statedTimeComplexity: 'O(n^2)', // Suboptimal claim
      statedSpaceComplexity: 'O(n)'   // Wrong claim
    }
  });
  saveUnderstandingAssessment(ass);

  const rec = getAdaptiveRecommendation();
  // Should NOT be a Medium difficulty problem
  assert(rec.difficulty !== 'Medium', `Should NOT advance to Medium when complexity reasoning is flawed, got difficulty: ${rec.difficulty}`);
  assert(rec.badge.includes('Complexity'), `Expected complexity badge, got: ${rec.badge}`);
});

// ─── SUITE 6: Reflection Draft Persistence ────────────────────────────────────
console.log('\n[Suite 6: Reflection Draft Persistence]');

it('Saves and restores reflection drafts accurately', () => {
  clearAllProgress();

  const draft = {
    approachExplanation: 'Using two pointers from start and end',
    statedTimeComplexity: 'O(n)',
    statedSpaceComplexity: 'O(1)',
    complexityReasoning: 'Single pass scan',
    selectedQuizOption: 1,
    quizSubmitted: true
  };

  saveReflectionDraft('valid-palindrome', draft);
  const restored = getReflectionDraft('valid-palindrome');

  assert(restored !== null, 'Restored draft should not be null');
  assert(restored.approachExplanation === draft.approachExplanation, 'Approach matches');
  assert(restored.statedTimeComplexity === draft.statedTimeComplexity, 'Time matches');
  assert(restored.selectedQuizOption === 1, 'Quiz option matches');
  assert(restored.quizSubmitted === true, 'Quiz submitted matches');

  // Verify non-existent draft returns null
  assert(getReflectionDraft('unknown-problem') === null, 'Unknown draft returns null');
});

console.log('\n==================================================');
console.log(`Phase 2B Integration Test Results: ${passed}/${passed + failed} passed`);
if (failed === 0) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
} else {
  console.error(`FAILED: ${failed} test(s) failed.`);
  process.exit(1);
}
