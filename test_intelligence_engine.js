/**
 * test_intelligence_engine.js
 *
 * Automated Test Suite for Adaptive Problem-Solving Intelligence Engine.
 *
 * Validates:
 *  1. Insufficient evidence handling: refuses to fabricate scores when evidence is missing.
 *  2. Adjustment 6: Passing code with flawed complexity reasoning yields low complexity score and COMPLEXITY_DRILL.
 *  3. Adjustment 6: Failing code with sound conceptual understanding yields high conceptual score and EDGE_CASE_REMEDIATION.
 *  4. Excessive hint dependence: Level 3 Blueprint discount and BLIND_CHALLENGE recommendation.
 *  5. Complexity analysis: exact match, suboptimal match, and reasoning bonus.
 *  6. Clear separation between observed evidence (telemetry) and estimated understanding.
 *  7. All 5 dimensions remain separate and provide explicit calculation explanations.
 *  8. Pedagogical action selector maps accurately to student needs based on available evidence.
 *  9. Longitudinal trajectory tracking detects improving autonomy and recurring misconceptions.
 * 10. Presence of academic diagnostic disclaimers on all outputs.
 */

import {
  assessProblemSolving,
  evaluateImplementation,
  evaluateIndependence,
  evaluateComplexity,
  evaluateConceptualUnderstanding,
  evaluateAlgorithmSelection,
  evaluateLongitudinalTrajectory,
  PROBLEM_KNOWLEDGE_BASE
} from './src/services/intelligenceEngine.js';

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

console.log('--- Starting Adaptive Problem-Solving Intelligence Engine Tests ---\n');

// ─── SUITE 1: Insufficient Evidence Handling ─────────────────────────────────
console.log('[Suite 1: Insufficient Evidence & No Fabricated Scores]');

it('Returns null scores and insufficient_evidence state when no data is provided', () => {
  const result = assessProblemSolving({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    evidence: {}
  });

  assert(result.overallSummary.compositeScore === null, 'Composite score must be null for empty evidence');
  assert(result.overallSummary.evidenceReliability === 'insufficient', 'Reliability must be insufficient');
  assert(result.dimensions.implementationAbility.score === null, 'Implementation score must be null');
  assert(result.dimensions.implementationAbility.status === 'insufficient_evidence', 'Implementation must be insufficient_evidence');
  assert(result.dimensions.independence.score === null, 'Independence score must be null');
  assert(result.dimensions.complexityAnalysis.score === null, 'Complexity score must be null');
  assert(result.dimensions.conceptualUnderstanding.score === null, 'Conceptual score must be null');
  assert(result.dimensions.algorithmSelection.score === null, 'Algorithm score must be null');
  assert(result.recommendedAction.actionType === 'INSUFFICIENT_DATA', 'Should recommend INSUFFICIENT_DATA');
});

// ─── SUITE 2: Passing Code with Flawed Complexity Reasoning (Adjustment 6) ───
console.log('\n[Suite 2: Passing Code with Flawed Complexity Reasoning]');

it('Accepted code with incorrect complexity claims gets 100 implementation, low complexity, and COMPLEXITY_DRILL', () => {
  const result = assessProblemSolving({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    evidence: {
      submissionStatus: 'ACCEPTED',
      testsPassed: 4,
      totalTests: 4,
      executionTimeMs: 410,
      attemptCount: 1,
      hintsUnlocked: 0,
      statedTimeComplexity: 'O(1)', // Incorrect: Two sum hash table scan is O(n), not O(1)
      statedSpaceComplexity: 'O(n^2)', // Incorrect: Space is O(n)
      complexityReasoning: 'Hash maps are constant time.',
      approachExplanation: 'Used a hash map to check complement.'
    }
  });

  // Implementation is 100 (tests passed)
  assert(result.dimensions.implementationAbility.score === 100, `Expected 100 impl, got ${result.dimensions.implementationAbility.score}`);
  assert(result.dimensions.implementationAbility.tier === 'Proficient', 'Implementation tier should be Proficient');

  // Complexity analysis is low because O(1) time and O(n^2) space are wrong for Two Sum
  assert(result.dimensions.complexityAnalysis.score < 50, `Expected complexity < 50, got ${result.dimensions.complexityAnalysis.score}`);

  // Action selected is COMPLEXITY_DRILL (because implementation >= 80, but complexity < 60)
  assert(result.recommendedAction.actionType === 'COMPLEXITY_DRILL', `Expected COMPLEXITY_DRILL, got ${result.recommendedAction.actionType}`);
  assert(result.recommendedAction.badge.includes('Complexity'), 'Badge should reference complexity');
});

// ─── SUITE 3: Failing Code with Sound Conceptual Reasoning (Adjustment 6) ────
console.log('\n[Suite 3: Failing Code with Sound Conceptual Reasoning]');

it('Failing code with sound conceptual understanding gets high conceptual score and EDGE_CASE_REMEDIATION', () => {
  const result = assessProblemSolving({
    problemId: 'best-time-to-buy-and-sell-stock',
    problemTitle: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    evidence: {
      submissionStatus: 'WRONG_ANSWER',
      testsPassed: 3,
      totalTests: 4,
      mistakeCategory: 'BOUNDARY_ERROR',
      attemptCount: 2,
      hintsUnlocked: 0,
      statedTimeComplexity: 'O(n)',
      statedSpaceComplexity: 'O(1)',
      complexityReasoning: 'Single pass tracking minimum purchase price and maximal profit.',
      approachExplanation: 'Track min price seen so far and calculate difference on each day to find max profit.',
      comprehensionCheck: { answered: true, isCorrect: true }
    }
  });

  // Implementation failed on boundary test
  assert(result.dimensions.implementationAbility.score < 75, 'Implementation score should reflect partial test failure');

  // Conceptual understanding is sound because quiz is correct and approach text has key anchors
  assert(result.dimensions.conceptualUnderstanding.score >= 80, `Expected concept >= 80, got ${result.dimensions.conceptualUnderstanding.score}`);
  assert(result.dimensions.complexityAnalysis.score >= 85, `Expected complexity >= 85, got ${result.dimensions.complexityAnalysis.score}`);

  // Action selected is EDGE_CASE_REMEDIATION
  assert(result.recommendedAction.actionType === 'EDGE_CASE_REMEDIATION', `Expected EDGE_CASE_REMEDIATION, got ${result.recommendedAction.actionType}`);
});

// ─── SUITE 4: Excessive Hint Dependence ───────────────────────────────────────
console.log('\n[Suite 4: Excessive Hint Dependence]');

it('High hint reliance (Level 3 Blueprint) lowers independence score and triggers BLIND_CHALLENGE', () => {
  const result = assessProblemSolving({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    evidence: {
      submissionStatus: 'ACCEPTED',
      testsPassed: 4,
      totalTests: 4,
      attemptCount: 4,
      hintsUnlocked: 3, // Full Blueprint unlocked
      statedTimeComplexity: 'O(n)',
      statedSpaceComplexity: 'O(1)'
    }
  });

  assert(result.dimensions.implementationAbility.score === 100, 'Implementation is 100');
  assert(result.dimensions.independence.score <= 35, `Independence should be <= 35, got ${result.dimensions.independence.score}`);
  assert(result.recommendedAction.actionType === 'BLIND_CHALLENGE', `Expected BLIND_CHALLENGE, got ${result.recommendedAction.actionType}`);
});

// ─── SUITE 5: Complexity Analysis Details ─────────────────────────────────────
console.log('\n[Suite 5: Complexity Analysis Dimension Details]');

it('Correctly scores optimal, suboptimal, and missing complexity', () => {
  // 1. Optimal Two Sum
  const optimal = evaluateComplexity({
    statedTime: 'O(n)',
    statedSpace: 'O(n)',
    complexityReasoning: 'Single pass through array with hash map lookups in constant average time.',
    problemId: 'two-sum'
  });
  assert(optimal.score >= 90, `Optimal should score >= 90, got ${optimal.score}`);
  assert(optimal.tier === 'Proficient', 'Tier should be Proficient');

  // 2. Suboptimal Two Sum (nested loops)
  const suboptimal = evaluateComplexity({
    statedTime: 'O(n^2)',
    statedSpace: 'O(1)',
    complexityReasoning: 'Two nested loops checking all pairs.',
    problemId: 'two-sum'
  });
  assert(suboptimal.score >= 70 && suboptimal.score < 90, `Suboptimal should score between 70 and 89, got ${suboptimal.score}`);

  // 3. Missing complexity
  const missing = evaluateComplexity({
    problemId: 'two-sum'
  });
  assert(missing.score === null, 'Missing complexity should have null score');
  assert(missing.status === 'insufficient_evidence', 'Missing complexity should be insufficient_evidence');
});

// ─── SUITE 6: Separation of Observed Evidence & Estimated Understanding ───────
console.log('\n[Suite 6: Separation of Evidence and Estimates]');

it('Structured assessment cleanly partitions observed telemetry from estimated dimensions', () => {
  const result = assessProblemSolving({
    problemId: 'binary-search',
    problemTitle: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    evidence: {
      submissionStatus: 'ACCEPTED',
      testsPassed: 4,
      totalTests: 4,
      executionTimeMs: 380,
      attemptCount: 1,
      hintsUnlocked: 0,
      statedTimeComplexity: 'O(log n)',
      statedSpaceComplexity: 'O(1)',
      approachExplanation: 'Divided search space in half each iteration using mid pointer.'
    }
  });

  // Verify observed facts section contains exact telemetry
  assert(result.observedEvidence.submissionStatus === 'ACCEPTED', 'Observed status matches');
  assert(result.observedEvidence.testsPassed === 4, 'Observed testsPassed matches');
  assert(result.observedEvidence.attemptCount === 1, 'Observed attemptCount matches');
  assert(result.observedEvidence.hintsUnlocked === 0, 'Observed hintsUnlocked matches');

  // Verify dimensions are kept separate
  assert(result.dimensions.implementationAbility.evidenceType === 'OBSERVED_TELEMETRY', 'Impl type is telemetry');
  assert(result.dimensions.independence.evidenceType === 'OBSERVED_TELEMETRY', 'Indep type is telemetry');
  assert(result.dimensions.complexityAnalysis.evidenceType === 'OBSERVED_CLAIM_VS_CANONICAL', 'Comp type is claim vs canonical');
  assert(result.dimensions.conceptualUnderstanding.evidenceType === 'ESTIMATED_COGNITIVE', 'Concept type is estimated cognitive');
  assert(result.dimensions.algorithmSelection.evidenceType === 'ESTIMATED_STRATEGY', 'Algo type is estimated strategy');

  // Verify each dimension has an explicit calculation string
  for (const [key, dim] of Object.entries(result.dimensions)) {
    assert(typeof dim.calculation === 'string' && dim.calculation.length > 0, `Dimension ${key} missing calculation explanation`);
    assert(typeof dim.limitationNote === 'string' && dim.limitationNote.length > 0, `Dimension ${key} missing limitation note`);
  }
});

// ─── SUITE 7: Longitudinal Trajectory Tracking ────────────────────────────────
console.log('\n[Suite 7: Longitudinal Trajectory Tracking]');

it('Detects improving autonomy trend across multiple sessions', () => {
  const history = [
    {
      timestamp: '2026-10-20T10:00:00Z',
      observedEvidence: { mistakeCategory: null },
      dimensions: { independence: { score: 40 } }
    },
    {
      timestamp: '2026-10-22T10:00:00Z',
      observedEvidence: { mistakeCategory: null },
      dimensions: { independence: { score: 65 } }
    },
    {
      timestamp: '2026-10-25T10:00:00Z',
      observedEvidence: { mistakeCategory: null },
      dimensions: { independence: { score: 85 } }
    }
  ];

  const trajectory = evaluateLongitudinalTrajectory(history);
  assert(trajectory.hasData === true, 'Trajectory should have data');
  assert(trajectory.independenceTrend === 'improving', `Expected improving, got ${trajectory.independenceTrend}`);
  assert(trajectory.latestIndependenceScore === 85, 'Latest score should be 85');
});

it('Detects recurring mistake patterns across historical sessions', () => {
  const history = [
    {
      timestamp: '2026-10-20T10:00:00Z',
      observedEvidence: { mistakeCategory: 'BOUNDARY_ERROR' },
      dimensions: { independence: { score: 70 } }
    },
    {
      timestamp: '2026-10-22T10:00:00Z',
      observedEvidence: { mistakeCategory: 'RUNTIME_ERROR' },
      dimensions: { independence: { score: 70 } }
    },
    {
      timestamp: '2026-10-25T10:00:00Z',
      observedEvidence: { mistakeCategory: 'BOUNDARY_ERROR' },
      dimensions: { independence: { score: 70 } }
    }
  ];

  const trajectory = evaluateLongitudinalTrajectory(history);
  assert(trajectory.recurringMisconceptions.length === 1, 'Should find 1 recurring misconception');
  assert(trajectory.recurringMisconceptions[0].category === 'BOUNDARY_ERROR', 'Recurring mistake should be BOUNDARY_ERROR');
  assert(trajectory.recurringMisconceptions[0].occurrences === 2, 'Should have 2 occurrences');
});

// ─── SUITE 8: Academic Disclaimers ────────────────────────────────────────────
console.log('\n[Suite 8: Academic Diagnostic Disclaimers]');

it('All assessment records contain academic diagnostic disclaimers', () => {
  const result = assessProblemSolving({
    problemId: 'two-sum',
    evidence: { submissionStatus: 'ACCEPTED', testsPassed: 4, totalTests: 4 }
  });

  assert(typeof result.disclaimer === 'string' && result.disclaimer.includes('pedagogical'), 'Disclaimer must be present');
});

console.log('\n==================================================');
console.log(`Intelligence Engine Test Results: ${passed}/${passed + failed} passed`);
if (failed === 0) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
} else {
  console.error(`FAILED: ${failed} test(s) failed.`);
  process.exit(1);
}
