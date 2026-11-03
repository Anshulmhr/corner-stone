/**
 * test_ai_coach.cjs
 *
 * Automated Test Suite for Context-Aware AI Learning Coach.
 *
 * Validates:
 *  1. Progressive hints (Level 1 Nudge -> Level 2 Approach -> Level 3 Blueprint; no code spoilers)
 *  2. Missing context (empty code, pre-submission state, unregistered problem fallback)
 *  3. Provider failure & deterministic fallback handling
 *  4. Strict Blind Solve mode restrictions (server & handler blocking)
 *  5. Mistake explanation across diagnosis categories (Compilation, Runtime, Edge-Case, TLE, Accepted)
 *  6. Test My Understanding interactive check / tracing exercises
 *  7. Hidden test case and secret protection (no leaks)
 */

'use strict';

const assert = require('assert');
const { handleCoachRequest, generateDeterministicResponse } = require('./server/coachService.js');
const app = require('./server/index.js');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${err.message}`);
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${err.message}`);
  }
}

async function runAll() {
  console.log('Running Context-Aware AI Learning Coach Test Suite...\n');

  // ─── 1. Progressive Hints ──────────────────────────────────────────────────
  console.log('[Suite 1: Progressive Hints]');

  await itAsync('Hint Level 1 returns a conceptual nudge without spoiling the full solution', async () => {
    const res = await handleCoachRequest({
      action: 'hint',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      topic: 'Arrays',
      hintLevel: 1
    });

    assert.strictEqual(res.ok, true, 'Response must be ok');
    assert.strictEqual(res.data.level, 1, 'Level must be 1');
    assert.strictEqual(res.data.canProgress, true, 'Can progress to level 2');
    assert.ok(res.data.content.includes('hash') || res.data.content.includes('complement') || res.data.content.includes('visited'), 'Hint 1 mentions conceptual nudge');
    assert.strictEqual(res.data.content.includes('vector<int>'), false, 'Hint 1 must not contain full C++ solution');
  });

  await itAsync('Hint Level 2 returns a more specific approach', async () => {
    const res = await handleCoachRequest({
      action: 'hint',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      topic: 'Arrays',
      hintLevel: 2
    });

    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.level, 2);
    assert.strictEqual(res.data.canProgress, true);
    assert.ok(res.data.content.includes('unordered_map') || res.data.content.includes('map'), 'Hint 2 specifies data structure');
  });

  await itAsync('Hint Level 3 returns an algorithmic blueprint and marks canProgress=false', async () => {
    const res = await handleCoachRequest({
      action: 'hint',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      topic: 'Arrays',
      hintLevel: 3
    });

    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.level, 3);
    assert.strictEqual(res.data.canProgress, false, 'CanProgress must be false at level 3');
    assert.ok(res.data.content.includes('seen'), 'Hint 3 provides step-by-step logic');
  });

  // ─── 2. Missing Context Handling ───────────────────────────────────────────
  console.log('\n[Suite 2: Missing Context Handling]');

  await itAsync('Handles empty user code gracefully without throwing', async () => {
    const res = await handleCoachRequest({
      action: 'explain',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      userCode: '   '
    });

    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.category, 'EMPTY_SUBMISSION');
    assert.ok(res.data.explanation.includes('written or submitted'), 'Mentions no code written yet');
    assert.ok(res.data.nextStep, 'Provides actionable next step');
  });

  await itAsync('Handles pre-submission state (no execution outcome yet)', async () => {
    const res = await handleCoachRequest({
      action: 'explain',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      userCode: 'class Solution { public: vector<int> twoSum(...) {} };',
      submissionOutcome: null
    });

    assert.strictEqual(res.ok, true);
    assert.ok(res.data.explanation, 'Provides guidance for pre-submission code');
    assert.ok(res.data.nextStep.includes('Run your code') || res.data.nextStep.includes('Submit'), 'Encourages running code');
  });

  await itAsync('Falls back gracefully for an unregistered DSA problem', async () => {
    const res = await handleCoachRequest({
      action: 'hint',
      problemId: 'custom-graph-problem',
      problemTitle: 'Find Shortest Path',
      topic: 'Graphs',
      hintLevel: 1
    });

    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.data.level, 1);
    assert.ok(res.data.content.includes('Graphs'), 'Uses generic topic knowledge without crashing');
  });

  // ─── 3. Provider Failure & Deterministic Fallback ──────────────────────────
  console.log('\n[Suite 3: Provider Failure & Deterministic Fallback]');

  await itAsync('Uses deterministic fallback when no API key is configured', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenAI = process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const res = await handleCoachRequest({
        action: 'explain',
        problemId: 'best-time-to-buy-and-sell-stock',
        problemTitle: 'Best Time to Buy and Sell Stock',
        topic: 'Arrays',
        userCode: 'class Solution { };',
        submissionOutcome: {
          status: 'WRONG_ANSWER',
          passedCount: 1,
          totalCount: 3,
          diagnosis: {
            category: 'EDGE_CASE_FAILURE',
            label: 'Edge-Case Failure',
            explanation: 'Failed on edge cases.'
          }
        }
      });

      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.source, 'deterministic', 'Must report source as deterministic');
      assert.strictEqual(res.data.category, 'EDGE_CASE_FAILURE');
      assert.ok(res.data.details.includes('edge cases'), 'Includes edge-case debugging guidance');
    } finally {
      if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
      if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
    }
  });

  await itAsync('Recovers gracefully to deterministic fallback if external provider fails/times out', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'INVALID_MOCK_KEY_FOR_TESTING';

    try {
      const res = await handleCoachRequest({
        action: 'explain',
        problemId: 'valid-anagram',
        problemTitle: 'Valid Anagram',
        topic: 'Strings',
        userCode: 'class Solution { public: bool isAnagram(...) {} };',
        submissionOutcome: {
          status: 'COMPILATION_ERROR',
          compilerError: 'error: expected ";" before "}"'
        }
      });

      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.source, 'deterministic', 'Must fall back to deterministic on provider error');
      assert.strictEqual(res.data.category, 'COMPILATION_ERROR');
      assert.ok(res.data.details.includes('semicolon'), 'Contains compilation guidance');
    } finally {
      if (originalGemini) {
        process.env.GEMINI_API_KEY = originalGemini;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    }
  });

  // ─── 4. Blind Solve Mode Restrictions ──────────────────────────────────────
  console.log('\n[Suite 4: Blind Solve Mode Restrictions]');

  await itAsync('Direct coach handler strictly blocks access when isBlindMode=true', async () => {
    const res = await handleCoachRequest({
      action: 'hint',
      problemId: 'two-sum',
      hintLevel: 1,
      isBlindMode: true
    });

    assert.strictEqual(res.ok, false, 'Must not be ok in Blind Solve mode');
    assert.strictEqual(res.blockedByBlindMode, true, 'Must indicate blockedByBlindMode');
    assert.ok(res.message.includes('Blind Solve Challenge Mode'), 'Informs user about blind solve lock');
    assert.strictEqual(res.data, undefined, 'Must not reveal hint data');
  });

  await itAsync('Server POST /api/coach returns HTTP 403 when isBlindMode=true', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const resp = await fetch(`http://127.0.0.1:${port}/api/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hint',
          problemId: 'two-sum',
          hintLevel: 1,
          isBlindMode: true
        })
      });

      assert.strictEqual(resp.status, 403, 'Must return HTTP 403 Forbidden');
      const data = await resp.json();
      assert.strictEqual(data.blockedByBlindMode, true);
      assert.ok(data.message.includes('Blind Solve Challenge Mode'));
    } finally {
      server.close();
    }
  });

  // ─── 5. Mistake Diagnosis Categories ───────────────────────────────────────
  console.log('\n[Suite 5: Mistake Explanation Categories]');

  await itAsync('Explains COMPILATION_ERROR with actionable syntax steps', async () => {
    const res = await handleCoachRequest({
      action: 'explain',
      problemId: 'two-sum',
      userCode: 'int a = 5',
      submissionOutcome: {
        status: 'COMPILATION_ERROR',
        compilerError: 'error: expected ";" before "}"'
      }
    });

    assert.strictEqual(res.data.category, 'COMPILATION_ERROR');
    assert.ok(res.data.details.includes('semicolon'));
    assert.ok(res.data.compilerSnippet.includes('expected ";"'));
  });

  await itAsync('Explains RUNTIME_ERROR with memory/vector boundary steps', async () => {
    const res = await handleCoachRequest({
      action: 'explain',
      problemId: 'two-sum',
      userCode: 'nums[1000] = 5;',
      submissionOutcome: {
        status: 'RUNTIME_ERROR',
        runtimeError: 'Segmentation fault (core dumped)'
      }
    });

    assert.strictEqual(res.data.category, 'RUNTIME_ERROR');
    assert.ok(res.data.details.includes('bounds') || res.data.details.includes('Segmentation'));
  });

  await itAsync('Explains TIME_LIMIT_EXCEEDED with time complexity reduction steps', async () => {
    const res = await handleCoachRequest({
      action: 'explain',
      problemId: 'two-sum',
      userCode: 'while(true) {}',
      submissionOutcome: {
        status: 'TIME_LIMIT_EXCEEDED'
      }
    });

    assert.strictEqual(res.data.category, 'TLE');
    assert.ok(res.data.explanation.includes('timed out'));
    assert.ok(res.data.nextStep.includes('hash map') || res.data.nextStep.includes('complexity'));
  });

  await itAsync('Congratulates and prompts complexity reflection when ACCEPTED', async () => {
    const res = await handleCoachRequest({
      action: 'explain',
      problemId: 'two-sum',
      userCode: '...valid solution...',
      submissionOutcome: {
        status: 'ACCEPTED',
        passedCount: 3,
        totalCount: 3
      }
    });

    assert.strictEqual(res.data.category, 'ACCEPTED');
    assert.ok(res.data.explanation.includes('passed all'));
    assert.ok(res.data.details.includes('space complexities') || res.data.details.includes('mastery'));
  });

  // ─── 6. Test My Understanding ──────────────────────────────────────────────
  console.log('\n[Suite 6: Test My Understanding Interactive Checks]');

  await itAsync('Generates valid multiple-choice check with options and explanation', async () => {
    const res = await handleCoachRequest({
      action: 'test',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      topic: 'Arrays'
    });

    assert.strictEqual(res.ok, true);
    assert.ok(res.data.question.length > 10, 'Question must be formulated');
    assert.ok(Array.isArray(res.data.options), 'Options must be an array');
    assert.ok(res.data.options.length >= 2, 'Must have at least 2 options');
    assert.ok(res.data.correctIndex >= 0 && res.data.correctIndex < res.data.options.length, 'correctIndex must be in bounds');
    assert.ok(res.data.explanation.length > 5, 'Explanation must be provided');
  });

  // ─── 7. Hidden Test & Secret Protection ────────────────────────────────────
  console.log('\n[Suite 7: Hidden Test & Secret Protection]');

  await itAsync('Never reveals or forwards hidden test cases', async () => {
    const res = await handleCoachRequest({
      action: 'explain',
      problemId: 'two-sum',
      submissionOutcome: {
        status: 'WRONG_ANSWER',
        passedCount: 2,
        totalCount: 3
      }
    });

    const str = JSON.stringify(res);
    assert.strictEqual(str.includes('listen", t = "silent'), false);
    assert.strictEqual(str.includes('-3, 4, 3, 90'), false);
    assert.strictEqual(str.includes('CASE:3:OUT'), false);
  });

  console.log('\n' + '='.repeat(50));
  console.log(`AI Coach Test Results: ${passedTests}/${totalTests} passed`);
  if (passedTests === totalTests) {
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
    process.exit(0);
  } else {
    console.error(`FAILED: ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
