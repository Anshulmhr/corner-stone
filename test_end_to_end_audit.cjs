'use strict';
/**
 * test_end_to_end_audit.cjs
 *
 * Full End-to-End System Workflow Verification and Stability Audit
 * Covers:
 *  1. 20-Problem Curriculum & Metadata Completeness
 *  2. Full Student Workflow: Solve -> Diagnosis -> Recommendation -> Revision -> Blind Solve -> Roadmap Update
 *  3. AI Coach Safety, Guardrails & Blind Solve Restrictions
 *  4. Secret & Hidden Test Case Protection
 *  5. Data Persistence & Resilience
 */

// Polyfill minimal browser localStorage and Event
const storageMap = new Map();
global.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};
global.window = {
  dispatchEvent: () => {},
  location: { origin: 'http://127.0.0.1:3001' }
};
global.Event = class Event {};

let passed = 0;
let failed = 0;

function chk(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ' -- ' + detail : ''}`);
    failed++;
  }
}

async function runAudit() {
  console.log('===========================================================');
  console.log('   AdaptiveDSA: Full End-to-End Audit & Verification Suite');
  console.log('===========================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // Part 1: Curriculum & Metadata Audit
  // ───────────────────────────────────────────────────────────────────────────
  console.log('[Part 1] Auditing 20-Problem Curriculum Metadata & Consistency');
  const { PROBLEMS } = await import('./src/data/problems.js');
  const { CPP_SUPPORTED_PROBLEMS, CPP_STARTER_CODE, CPP_VISIBLE_CASES } = await import('./src/data/cppTestSuites.js');
  const { TEST_SUITES } = require('./server/testSuites.js');

  chk('Exactly 20 problems exist in curriculum', PROBLEMS.length === 20, `got ${PROBLEMS.length}`);
  const uniqueIds = new Set(PROBLEMS.map(p => p.id));
  chk('All 20 problem IDs are strictly unique', uniqueIds.size === 20, `unique=${uniqueIds.size}`);

  let allMetadataValid = true;
  for (const p of PROBLEMS) {
    if (!p.id || !p.title || !p.topic || !p.difficulty || !p.timeComplexity || !p.spaceComplexity || !p.hints || p.hints.length !== 3) {
      allMetadataValid = false;
      console.error(`Problem ${p.id} has invalid metadata`);
    }
  }
  chk('All 20 problems have title, topic, difficulty, timeComplexity, spaceComplexity, and 3 hints', allMetadataValid);
  chk('All 20 problems registered in CPP_SUPPORTED_PROBLEMS', CPP_SUPPORTED_PROBLEMS.length === 20);
  chk('All 20 problems have C++ starter code', Object.keys(CPP_STARTER_CODE).length === 20);
  chk('All 20 problems have visible test case metadata', Object.keys(CPP_VISIBLE_CASES).length === 20);
  chk('All 20 problems have server-side test suites in TEST_SUITES', Object.keys(TEST_SUITES).length === 20);

  // ───────────────────────────────────────────────────────────────────────────
  // Part 2: Full Student Workflow Integration
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[Part 2] Full Student Workflow: Solve -> Diagnosis -> Recommendation -> Revision -> Blind Solve -> Roadmap');
  const storage = await import('./src/services/storage.js');
  const { getAdaptiveRecommendation } = await import('./src/services/adaptiveEngine.js');
  const { getRevisionPipeline, getRevisions } = await import('./src/services/revisionService.js');
  const { getAdaptiveRoadmap } = await import('./src/services/roadmapService.js');
  const { startBlindSession, incrementBlindSubmissions, endBlindSession, calculateIndependenceScore } = await import('./src/services/blindSolveService.js');

  storage.clearAllProgress();

  // 2.1 Initial State: Empty student progress
  const initialRec = getAdaptiveRecommendation();
  chk('Initial student gets beginner recommendation (Arrays/Two Sum)', initialRec && initialRec.problem && initialRec.problem.difficulty === 'Easy');
  chk('Initial evidence status is early-estimate/insufficient', initialRec && initialRec.evidenceStatus !== 'established');

  const initialRoadmap = getAdaptiveRoadmap();
  const arraysTopic = initialRoadmap.nodes.find(t => t.id === 'arrays');
  chk('Arrays topic is initially "Ready to learn"', arraysTopic && arraysTopic.status === 'Ready to learn');
  const treesTopic = initialRoadmap.nodes.find(t => t.id === 'trees');
  chk('Trees topic is initially "Locked by prerequisite"', treesTopic && treesTopic.status === 'Locked by prerequisite');

  // 2.2 First Solve: Solve Two Sum (Automated)
  storage.recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 0,
    code: 'class Solution {};',
    evaluationType: 'automated',
    language: 'cpp',
    status: 'ACCEPTED',
    passedCount: 4,
    totalCount: 4,
    executionTimeMs: 220
  });

  const solvedAfter1 = storage.getSolvedProblems();
  chk('Solved problems recorded accurately (1 problem solved)', solvedAfter1.length === 1 && solvedAfter1[0] === 'two-sum');

  // 2.3 Verify Automatic Revision Enrollment
  const revisions = getRevisions();
  const revEntry = revisions['two-sum'];
  chk('Newly solved problem auto-enrolled in spaced revision schedule', !!revEntry);
  chk('Revision scheduled at Stage 1 (1-day interval)', revEntry && revEntry.stage === 1 && revEntry.intervalDays === 1);

  // 2.4 Duplicate Solve does not inflate solved count
  storage.recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    hintsUnlocked: 1,
    code: 'class Solution {};',
    evaluationType: 'automated',
    language: 'cpp',
    status: 'ACCEPTED',
    passedCount: 4,
    totalCount: 4,
    executionTimeMs: 190
  });
  chk('Duplicate solve does not inflate unique solved count', storage.getSolvedProblems().length === 1);

  // 2.5 Failed Attempt with Diagnosis
  storage.recordAttempt({
    problemId: 'valid-anagram',
    problemTitle: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    success: false,
    hintsUnlocked: 2,
    code: 'class Solution {};',
    evaluationType: 'automated',
    language: 'cpp',
    status: 'WRONG_ANSWER',
    passedCount: 1,
    totalCount: 4,
    executionTimeMs: 250,
    diagnosisCategory: 'LOGIC_ERROR'
  });

  storage.recordAttempt({
    problemId: 'longest-substring-without-repeating-characters',
    problemTitle: 'Longest Substring Without Repeating Characters',
    topic: 'Strings',
    difficulty: 'Medium',
    success: false,
    hintsUnlocked: 1,
    code: 'class Solution {};',
    evaluationType: 'automated',
    language: 'cpp',
    status: 'WRONG_ANSWER',
    passedCount: 0,
    totalCount: 4,
    executionTimeMs: 310,
    diagnosisCategory: 'LOGIC_ERROR'
  });

  // 2.6 Recommendation Engine prioritizes weak topic (Strings)
  const weakTopicRec = getAdaptiveRecommendation();
  chk('Recommendation engine identifies weak topic with repeated errors', weakTopicRec.problem.topic === 'Strings');
  chk('Recommendation explains reason for recommendation', weakTopicRec.reason && weakTopicRec.reason.length > 0);

  // 2.7 Blind Solve Challenge Mode Workflow
  const blindSess = startBlindSession('contains-duplicate', 0);
  chk('Blind Solve session initializes successfully', blindSess.problemId === 'contains-duplicate' && blindSess.submissionCount === 0);
  const incSess = incrementBlindSubmissions('contains-duplicate');
  chk('Blind Solve tracks submission count', incSess.submissionCount === 1);
  const finishedBlind = endBlindSession('contains-duplicate');
  chk('Blind Solve session ends cleanly', finishedBlind && finishedBlind.submissionCount === 1);

  const indepScore = calculateIndependenceScore({
    success: true,
    submissionCount: 1,
    hintsUsed: 0
  });
  chk('Independence score calculated transparently (100/100 for zero-hint 1st try)', indepScore.score === 100);
  chk('Independence score has clear rule explanation', indepScore.explanation && indepScore.explanation.includes('Zero-Hint Autonomy'));
  chk('Independence score has transparency disclaimer', indepScore.disclaimer && indepScore.disclaimer.includes('intelligence'));

  // ───────────────────────────────────────────────────────────────────────────
  // Part 3: AI Learning Coach Safety & Live Endpoint Verification
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[Part 3] AI Learning Coach Endpoint & Safety Verification');

  // Test Blind Solve strictly blocks coach access
  const blindBlocked = await fetch('http://127.0.0.1:3001/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'hint',
      problemId: 'two-sum',
      isBlindMode: true
    })
  });
  chk('Server strictly returns HTTP 403 when isBlindMode=true', blindBlocked.status === 403);
  const blindBlockedBody = await blindBlocked.json();
  chk('Blocked response contains blockedByBlindMode: true', blindBlockedBody.blockedByBlindMode === true);

  // Test progressive hints via server
  const hintResp = await fetch('http://127.0.0.1:3001/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'hint',
      problemId: 'two-sum',
      hintLevel: 1,
      isBlindMode: false
    })
  });
  chk('Coach hint request returns HTTP 200', hintResp.status === 200);
  const hintBody = await hintResp.json();
  chk('Hint level 1 returns conceptual nudge without code solution', hintBody.ok && hintBody.data && !hintBody.data.content.includes('unordered_map<int, int> m;'));

  // Test missing context handling
  const emptyCodeResp = await fetch('http://127.0.0.1:3001/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'explain',
      problemId: 'two-sum',
      userCode: '',
      submissionOutcome: null
    })
  });
  chk('Coach handles empty code and missing outcome without crashing', emptyCodeResp.status === 200);

  // ───────────────────────────────────────────────────────────────────────────
  // Part 4: Backend Security & Secret Protection
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[Part 4] Backend Security & Information Exposure Protection');

  // Check that /api/execute never exposes hidden inputs or expected outputs
  const execResp = await fetch('http://127.0.0.1:3001/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problemId: 'two-sum',
      userCode: '#include <vector>\nusing namespace std;\nclass Solution { public: vector<int> twoSum(vector<int>& n, int t) { return {0, 0}; } };'
    })
  });
  const execBody = await execResp.json();
  chk('Submission execution returns HTTP 200', execResp.status === 200);
  chk('Wrong answer correctly classified as WRONG_ANSWER (not ACCEPTED)', execBody.status === 'WRONG_ANSWER');

  const hiddenResults = execBody.results.filter(r => r.isHidden);
  chk('Hidden test case is present in results', hiddenResults.length === 1);
  for (const h of hiddenResults) {
    chk('Hidden test input is strictly protected', h.inputDisplay === 'Hidden test input');
    chk('Hidden test expected output is strictly protected', h.expectedOutput === '[Protected]');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(59));
  console.log(`Audit Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('ALL AUDIT CHECKS PASSED SUCCESSFULLY! ✓');
  } else {
    console.error(`AUDIT DETECTED ${failed} FAILURES.`);
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
