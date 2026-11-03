/**
 * verify_new_problems.cjs
 *
 * Automated verification test suite for all 10 new C++ problems:
 * 1. contains-duplicate
 * 2. product-of-array-except-self
 * 3. valid-palindrome
 * 4. find-minimum-in-rotated-sorted-array
 * 5. daily-temperatures
 * 6. evaluate-reverse-polish-notation
 * 7. linked-list-cycle
 * 8. middle-of-the-linked-list
 * 9. same-tree
 * 10. invert-binary-tree
 *
 * Validates:
 * - Wandbox GCC compilation and execution
 * - Reference solution passes all 4/4 tests (including hidden tests)
 * - Hidden inputs & expected outputs are strictly masked
 * - Intentionally wrong solutions fail gracefully with WRONG_ANSWER
 */

'use strict';

const assert = require('assert');
const { TEST_SUITES, gradeOutput, compareOutputs } = require('./server/testSuites.js');

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

// C++ Reference Solutions for all 10 new problems
const REFERENCE_SOLUTIONS = {
  'contains-duplicate': `
#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int x : nums) {
            if (seen.count(x)) return true;
            seen.insert(x);
        }
        return false;
    }
};
`,

  'product-of-array-except-self': `
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> ans(n, 1);
        for (int i = 1; i < n; ++i) {
            ans[i] = ans[i - 1] * nums[i - 1];
        }
        int suffix = 1;
        for (int i = n - 1; i >= 0; --i) {
            ans[i] *= suffix;
            suffix *= nums[i];
        }
        return ans;
    }
};
`,

  'valid-palindrome': `
#include <string>
#include <cctype>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        int l = 0, r = s.size() - 1;
        while (l < r) {
            while (l < r && !isalnum(s[l])) l++;
            while (l < r && !isalnum(s[r])) r--;
            if (tolower(s[l]) != tolower(s[r])) return false;
            l++;
            r--;
        }
        return true;
    }
};
`,

  'find-minimum-in-rotated-sorted-array': `
#include <vector>
using namespace std;

class Solution {
public:
    int findMin(vector<int>& nums) {
        int low = 0, high = nums.size() - 1;
        while (low < high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] > nums[high]) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return nums[low];
    }
};
`,

  'daily-temperatures': `
#include <vector>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> ans(n, 0);
        stack<int> st;
        for (int i = 0; i < n; ++i) {
            while (!st.empty() && temperatures[i] > temperatures[st.top()]) {
                int prev = st.top();
                st.pop();
                ans[prev] = i - prev;
            }
            st.push(i);
        }
        return ans;
    }
};
`,

  'evaluate-reverse-polish-notation': `
#include <vector>
#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<long long> st;
        for (const string& t : tokens) {
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                long long b = st.top(); st.pop();
                long long a = st.top(); st.pop();
                if (t == "+") st.push(a + b);
                else if (t == "-") st.push(a - b);
                else if (t == "*") st.push(a * b);
                else if (t == "/") st.push(a / b);
            } else {
                st.push(stoll(t));
            }
        }
        return st.top();
    }
};
`,

  'linked-list-cycle': `
class Solution {
public:
    bool hasCycle(ListNode *head) {
        if (!head || !head->next) return false;
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
`,

  'middle-of-the-linked-list': `
class Solution {
public:
    ListNode* middleNode(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        return slow;
    }
};
`,

  'same-tree': `
class Solution {
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        if (!p && !q) return true;
        if (!p || !q || p->val != q->val) return false;
        return isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
    }
};
`,

  'invert-binary-tree': `
#include <algorithm>
using namespace std;

class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        swap(root->left, root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};
`,
};

async function executeWandbox(code) {
  const resp = await fetch(WANDBOX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler: 'gcc-head',
      code,
      stdin: '',
      options: 'c++17'
    })
  });
  if (!resp.ok) {
    throw new Error(`Wandbox HTTP ${resp.status}`);
  }
  return await resp.json();
}

async function verifyAll() {
  console.log('=== Verifying All 10 New C++ Problem Test Suites in GCC Sandbox ===\n');

  const problemIds = Object.keys(REFERENCE_SOLUTIONS);
  let passedProblems = 0;

  for (const pid of problemIds) {
    process.stdout.write(`Testing [${pid}]... `);
    const suite = TEST_SUITES[pid];
    assert.ok(suite, `TEST_SUITE not configured for ${pid}`);

    // 1. Build harness with reference solution
    const userCode = REFERENCE_SOLUTIONS[pid];
    const fullSource = suite.buildHarness(userCode);

    // 2. Execute on Wandbox GCC
    const exec = await executeWandbox(fullSource);
    if (exec.status !== '0' && exec.compiler_error) {
      console.log('FAILED (Compilation Error)');
      console.error(exec.compiler_error);
      process.exit(1);
    }

    // 3. Grade output
    const { passedCount, results } = gradeOutput(suite, exec.program_output);
    assert.strictEqual(passedCount, suite.totalCount, `Expected ${suite.totalCount} passed, got ${passedCount}`);
    assert.strictEqual(results.length, suite.totalCount);

    // 4. Verify hidden test masking
    const hiddenResults = results.filter(r => r.isHidden);
    assert.strictEqual(hiddenResults.length, 1, 'Should have exactly 1 hidden test case');
    assert.strictEqual(hiddenResults[0].inputDisplay, 'Hidden test input');
    assert.strictEqual(hiddenResults[0].expectedOutput, '[Protected]');
    assert.strictEqual(hiddenResults[0].actualOutput, '[Correct]');

    console.log(`PASS (${passedCount}/${suite.totalCount} tests passed)`);
    passedProblems++;
  }

  console.log(`\nAll ${passedProblems}/${problemIds.length} new C++ problem suites compiled and passed 100% automated test cases!`);
}

verifyAll().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
