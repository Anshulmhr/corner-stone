// Automated End-to-End Test Suite for Real C++ Code Execution & Evaluation
import { evaluateCppSubmission } from './src/services/codeExecutionService.js';
import { CPP_SUPPORTED_PROBLEMS } from './src/data/cppTestSuites.js';

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

const { recordAttempt, getSolvedProblems, getAttempts, clearAllProgress } = await import('./src/services/storage.js');

const results = [];
async function runTest(name, fn) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✓ PASS: ${name}`);
  } catch (err) {
    results.push({ name, passed: false, error: err.message });
    console.error(`✗ FAIL: ${name}: ${err.message}`);
  }
}

console.log('--- Starting AdaptiveDSA Real C++ Execution & Evaluation Tests ---\n');

// TEST 1: Empty Submission Handling
await runTest('1. Empty C++ submission is rejected with helpful message without calling compiler', async () => {
  const result = await evaluateCppSubmission('two-sum', '   \n  ');
  if (result.status !== 'EMPTY_SUBMISSION') throw new Error(`Expected EMPTY_SUBMISSION, got ${result.status}`);
  if (result.passedCount !== 0) throw new Error('Expected 0 passed count');
});

// TEST 2: Compilation Error Handling
await runTest('2. C++ syntax error produces genuine GCC compilation error output', async () => {
  const brokenCode = `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        this_is_an_undeclared_syntax_error();
    }
};
`;
  const result = await evaluateCppSubmission('two-sum', brokenCode);
  if (result.status !== 'COMPILATION_ERROR') throw new Error(`Expected COMPILATION_ERROR, got ${result.status}`);
  if (!result.compilerError.includes('undeclared') && !result.compilerError.includes('error')) {
    throw new Error(`Unexpected compiler error output: ${result.compilerError}`);
  }
});

// TEST 3: Runtime Error Handling
await runTest('3. Runtime crash (abort) produces RUNTIME_ERROR status', async () => {
  const crashingCode = `
#include <cstdlib>
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        abort();
        return {};
    }
};
`;
  const result = await evaluateCppSubmission('two-sum', crashingCode);
  if (result.status !== 'RUNTIME_ERROR') throw new Error(`Expected RUNTIME_ERROR, got ${result.status}`);
});

// TEST 4: Valid C++ with Incorrect Output (Wrong Answer)
await runTest('4. Valid C++ producing wrong outputs reports WRONG_ANSWER with test failure details', async () => {
  const wrongCode = `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {0, 0}; // Always wrong
    }
};
`;
  const result = await evaluateCppSubmission('two-sum', wrongCode);
  if (result.status !== 'WRONG_ANSWER') throw new Error(`Expected WRONG_ANSWER, got ${result.status}`);
  if (result.passedCount !== 0) throw new Error(`Expected 0 passed, got ${result.passedCount}`);
  if (result.results.length !== 4) throw new Error(`Expected 4 test results, got ${result.results.length}`);
});

// TEST 5: Valid Accepted C++ Submission for Problem 1 (Two Sum)
await runTest('5. Genuine correct C++ solution for Two Sum passes all 4 test cases (ACCEPTED)', async () => {
  const correctTwoSum = `
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> m;
        for (int i = 0; i < (int)nums.size(); i++) {
            int complement = target - nums[i];
            if (m.find(complement) != m.end()) {
                return {m[complement], i};
            }
            m[nums[i]] = i;
        }
        return {};
    }
};
`;
  const result = await evaluateCppSubmission('two-sum', correctTwoSum);
  if (result.status !== 'ACCEPTED') throw new Error(`Expected ACCEPTED, got ${result.status}`);
  if (result.passedCount !== 4) throw new Error(`Expected 4 passed test cases, got ${result.passedCount}`);

  // Verify hidden test case inputs are protected
  const hiddenCase = result.results.find(r => r.isHidden);
  if (!hiddenCase) throw new Error('Hidden test case not found');
  if (hiddenCase.inputDisplay.includes('-3, 4, 3, 90')) {
    throw new Error('Hidden test input was leaked in learner interface!');
  }
  if (hiddenCase.expectedOutput.includes('[0, 2]')) {
    throw new Error('Hidden test expected output was leaked in learner interface!');
  }
});

// TEST 6: Valid Accepted C++ Submission for Problem 2 (Stock)
await runTest('6. Genuine correct C++ solution for Best Time to Buy and Sell Stock passes all tests', async () => {
  const correctStock = `
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = 1e9;
        int maxProfit = 0;
        for (int p : prices) {
            minPrice = min(minPrice, p);
            maxProfit = max(maxProfit, p - minPrice);
        }
        return maxProfit;
    }
};
`;
  const result = await evaluateCppSubmission('best-time-to-buy-and-sell-stock', correctStock);
  if (result.status !== 'ACCEPTED') throw new Error(`Expected ACCEPTED, got ${result.status}`);
  if (result.passedCount !== 4) throw new Error(`Expected 4 passed, got ${result.passedCount}`);
});

// TEST 7: Valid Accepted C++ Submission for Problem 3 (Valid Anagram)
await runTest('7. Genuine correct C++ solution for Valid Anagram passes all tests', async () => {
  const correctAnagram = `
#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        vector<int> count(26, 0);
        for (char c : s) count[c - 'a']++;
        for (char c : t) {
            if (--count[c - 'a'] < 0) return false;
        }
        return true;
    }
};
`;
  const result = await evaluateCppSubmission('valid-anagram', correctAnagram);
  if (result.status !== 'ACCEPTED') throw new Error(`Expected ACCEPTED, got ${result.status}`);
  if (result.passedCount !== 4) throw new Error(`Expected 4 passed, got ${result.passedCount}`);
});

// TEST 8: Learning Progress Recording and Duplicate Solves Prevention
await runTest('8. Automated evaluation records progress and prevents duplicate solve inflation', async () => {
  clearAllProgress();

  // First automated solve
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    evaluationType: 'automated',
    language: 'cpp',
    status: 'ACCEPTED',
    passedCount: 4,
    totalCount: 4,
    executionTimeMs: 310
  });

  let solved = getSolvedProblems();
  if (solved.length !== 1) throw new Error(`Expected 1 solved problem, got ${solved.length}`);

  // Repeated automated solve
  recordAttempt({
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    success: true,
    evaluationType: 'automated',
    language: 'cpp',
    status: 'ACCEPTED',
    passedCount: 4,
    totalCount: 4,
    executionTimeMs: 290
  });

  solved = getSolvedProblems();
  if (solved.length !== 1) throw new Error(`Duplicate solve inflated count! Expected 1, got ${solved.length}`);

  const attempts = getAttempts();
  if (attempts.length !== 2) throw new Error(`Expected 2 attempt logs, got ${attempts.length}`);
  if (attempts[0].evaluationType !== 'automated') throw new Error('Expected automated evaluationType');
  if (attempts[0].language !== 'cpp') throw new Error('Expected cpp language recorded');
});

console.log('\n--- Real C++ Code Execution Test Summary ---');
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`Passed: ${passed}/${total}`);

if (passed !== total) {
  process.exit(1);
} else {
  console.log('All C++ execution and automated evaluation checks PASSED successfully!');
}
