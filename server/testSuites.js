/**
 * SERVER-SIDE ONLY — never imported by frontend code.
 *
 * Contains:
 *  - Hidden test inputs & expected outputs
 *  - C++ driver harness builders
 *  - Output grading logic
 *
 * The frontend (cppTestSuites.js) only knows visible test display metadata.
 */

'use strict';

// ─── Per-problem test suites ──────────────────────────────────────────────────

const TEST_SUITES = {
  'two-sum': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <algorithm>
using namespace std;

${userCode}

int main() {
    Solution sol;

    // Test 0 — visible
    try {
        vector<int> n0 = {2, 7, 11, 15};
        auto r0 = sol.twoSum(n0, 9);
        if (r0.size() >= 2) {
            int a = min(r0[0], r0[1]), b = max(r0[0], r0[1]);
            cout << "CASE:0:OUT:[" << a << ", " << b << "]" << endl;
        } else { cout << "CASE:0:OUT:[]" << endl; }
    } catch (...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    // Test 1 — visible
    try {
        vector<int> n1 = {3, 2, 4};
        auto r1 = sol.twoSum(n1, 6);
        if (r1.size() >= 2) {
            int a = min(r1[0], r1[1]), b = max(r1[0], r1[1]);
            cout << "CASE:1:OUT:[" << a << ", " << b << "]" << endl;
        } else { cout << "CASE:1:OUT:[]" << endl; }
    } catch (...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    // Test 2 — visible
    try {
        vector<int> n2 = {3, 3};
        auto r2 = sol.twoSum(n2, 6);
        if (r2.size() >= 2) {
            int a = min(r2[0], r2[1]), b = max(r2[0], r2[1]);
            cout << "CASE:2:OUT:[" << a << ", " << b << "]" << endl;
        } else { cout << "CASE:2:OUT:[]" << endl; }
    } catch (...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // Test 3 — HIDDEN (negative numbers)
    try {
        vector<int> n3 = {-3, 4, 3, 90};
        auto r3 = sol.twoSum(n3, 0);
        if (r3.size() >= 2) {
            int a = min(r3[0], r3[1]), b = max(r3[0], r3[1]);
            cout << "CASE:3:OUT:[" << a << ", " << b << "]" << endl;
        } else { cout << "CASE:3:OUT:[]" << endl; }
    } catch (...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },

    expectedOutputs: {
      0: '[0, 1]',
      1: '[1, 2]',
      2: '[0, 1]',
      3: '[0, 2]',  // hidden
    },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1',                  inputDisplay: 'nums = [2, 7, 11, 15], target = 9' },
      { id: 1, name: 'Example 2',                  inputDisplay: 'nums = [3, 2, 4], target = 6'      },
      { id: 2, name: 'Example 3 (Duplicate values)', inputDisplay: 'nums = [3, 3], target = 6'       },
      { id: 3, name: 'Hidden Test',                 inputDisplay: null                                },
    ],
  },

  'best-time-to-buy-and-sell-stock': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

${userCode}

int main() {
    Solution sol;

    try { vector<int> p0={7,1,5,3,6,4}; cout<<"CASE:0:OUT:"<<sol.maxProfit(p0)<<endl; }
    catch(...) { cout<<"CASE:0:ERROR:Exception thrown"<<endl; }

    try { vector<int> p1={7,6,4,3,1}; cout<<"CASE:1:OUT:"<<sol.maxProfit(p1)<<endl; }
    catch(...) { cout<<"CASE:1:ERROR:Exception thrown"<<endl; }

    try { vector<int> p2={2,4,1}; cout<<"CASE:2:OUT:"<<sol.maxProfit(p2)<<endl; }
    catch(...) { cout<<"CASE:2:ERROR:Exception thrown"<<endl; }

    // HIDDEN
    try { vector<int> p3={1,2}; cout<<"CASE:3:OUT:"<<sol.maxProfit(p3)<<endl; }
    catch(...) { cout<<"CASE:3:ERROR:Exception thrown"<<endl; }

    return 0;
}
`;
    },

    expectedOutputs: { 0: '5', 1: '0', 2: '2', 3: '1' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1',                      inputDisplay: 'prices = [7, 1, 5, 3, 6, 4]' },
      { id: 1, name: 'Example 2 (Decreasing Prices)',   inputDisplay: 'prices = [7, 6, 4, 3, 1]'   },
      { id: 2, name: 'Edge Case (Valley at end)',        inputDisplay: 'prices = [2, 4, 1]'         },
      { id: 3, name: 'Hidden Test',                     inputDisplay: null                          },
    ],
  },

  'valid-anagram': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

${userCode}

int main() {
    Solution sol;

    try { bool r0=sol.isAnagram("anagram","nagaram"); cout<<"CASE:0:OUT:"<<(r0?"true":"false")<<endl; }
    catch(...) { cout<<"CASE:0:ERROR:Exception thrown"<<endl; }

    try { bool r1=sol.isAnagram("rat","car"); cout<<"CASE:1:OUT:"<<(r1?"true":"false")<<endl; }
    catch(...) { cout<<"CASE:1:ERROR:Exception thrown"<<endl; }

    try { bool r2=sol.isAnagram("a","ab"); cout<<"CASE:2:OUT:"<<(r2?"true":"false")<<endl; }
    catch(...) { cout<<"CASE:2:ERROR:Exception thrown"<<endl; }

    // HIDDEN
    try { bool r3=sol.isAnagram("listen","silent"); cout<<"CASE:3:OUT:"<<(r3?"true":"false")<<endl; }
    catch(...) { cout<<"CASE:3:ERROR:Exception thrown"<<endl; }

    return 0;
}
`;
    },

    expectedOutputs: { 0: 'true', 1: 'false', 2: 'false', 3: 'true' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1',                    inputDisplay: 's = "anagram", t = "nagaram"' },
      { id: 1, name: 'Example 2',                    inputDisplay: 's = "rat", t = "car"'         },
      { id: 2, name: 'Edge Case (Different lengths)', inputDisplay: 's = "a", t = "ab"'            },
      { id: 3, name: 'Hidden Test',                   inputDisplay: null                           },
    ],
  },

  'contains-duplicate': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;

${userCode}

int main() {
    Solution sol;

    try { vector<int> n0 = {1, 2, 3, 1}; cout << "CASE:0:OUT:" << (sol.containsDuplicate(n0) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { vector<int> n1 = {1, 2, 3, 4}; cout << "CASE:1:OUT:" << (sol.containsDuplicate(n1) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { vector<int> n2 = {1, 1, 1, 3, 3, 4, 3, 2, 4, 2}; cout << "CASE:2:OUT:" << (sol.containsDuplicate(n2) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { vector<int> n3 = {-1, -2, -3, -1}; cout << "CASE:3:OUT:" << (sol.containsDuplicate(n3) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: 'true', 1: 'false', 2: 'true', 3: 'true' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Has Duplicate)',    inputDisplay: 'nums = [1, 2, 3, 1]' },
      { id: 1, name: 'Example 2 (All Distinct)',     inputDisplay: 'nums = [1, 2, 3, 4]' },
      { id: 2, name: 'Example 3 (Multiple Dups)',    inputDisplay: 'nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'product-of-array-except-self': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

${userCode}

void printVec(const vector<int>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        cout << v[i] << (i + 1 < v.size() ? ", " : "");
    }
    cout << "]";
}

int main() {
    Solution sol;

    try { vector<int> n0 = {1, 2, 3, 4}; auto r0 = sol.productExceptSelf(n0); cout << "CASE:0:OUT:"; printVec(r0); cout << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { vector<int> n1 = {-1, 1, 0, -3, 3}; auto r1 = sol.productExceptSelf(n1); cout << "CASE:1:OUT:"; printVec(r1); cout << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { vector<int> n2 = {2, 3}; auto r2 = sol.productExceptSelf(n2); cout << "CASE:2:OUT:"; printVec(r2); cout << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { vector<int> n3 = {0, 0}; auto r3 = sol.productExceptSelf(n3); cout << "CASE:3:OUT:"; printVec(r3); cout << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '[24, 12, 8, 6]', 1: '[0, 0, 9, 0, 0]', 2: '[3, 2]', 3: '[0, 0]' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1',                    inputDisplay: 'nums = [1, 2, 3, 4]' },
      { id: 1, name: 'Example 2 (Contains Zero)',    inputDisplay: 'nums = [-1, 1, 0, -3, 3]' },
      { id: 2, name: 'Edge Case (Two Elements)',     inputDisplay: 'nums = [2, 3]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'valid-palindrome': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <string>
#include <cctype>
using namespace std;

${userCode}

int main() {
    Solution sol;

    try { cout << "CASE:0:OUT:" << (sol.isPalindrome("A man, a plan, a canal: Panama") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { cout << "CASE:1:OUT:" << (sol.isPalindrome("race a car") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { cout << "CASE:2:OUT:" << (sol.isPalindrome(" ") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { cout << "CASE:3:OUT:" << (sol.isPalindrome("0P") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: 'true', 1: 'false', 2: 'true', 3: 'false' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Panama phrase)',    inputDisplay: 's = "A man, a plan, a canal: Panama"' },
      { id: 1, name: 'Example 2 (Non-palindrome)',   inputDisplay: 's = "race a car"' },
      { id: 2, name: 'Edge Case (Whitespace string)',inputDisplay: 's = " "' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'find-minimum-in-rotated-sorted-array': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

${userCode}

int main() {
    Solution sol;

    try { vector<int> n0 = {3, 4, 5, 1, 2}; cout << "CASE:0:OUT:" << sol.findMin(n0) << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { vector<int> n1 = {4, 5, 6, 7, 0, 1, 2}; cout << "CASE:1:OUT:" << sol.findMin(n1) << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { vector<int> n2 = {11, 13, 15, 17}; cout << "CASE:2:OUT:" << sol.findMin(n2) << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { vector<int> n3 = {2, 1}; cout << "CASE:3:OUT:" << sol.findMin(n3) << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '1', 1: '0', 2: '11', 3: '1' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1',                    inputDisplay: 'nums = [3, 4, 5, 1, 2]' },
      { id: 1, name: 'Example 2 (Pivot near start)', inputDisplay: 'nums = [4, 5, 6, 7, 0, 1, 2]' },
      { id: 2, name: 'Edge Case (Already Sorted)',   inputDisplay: 'nums = [11, 13, 15, 17]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'daily-temperatures': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
#include <stack>
using namespace std;

${userCode}

void printVec(const vector<int>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        cout << v[i] << (i + 1 < v.size() ? ", " : "");
    }
    cout << "]";
}

int main() {
    Solution sol;

    try { vector<int> t0 = {73, 74, 75, 71, 69, 72, 76, 73}; auto r0 = sol.dailyTemperatures(t0); cout << "CASE:0:OUT:"; printVec(r0); cout << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { vector<int> t1 = {30, 40, 50, 60}; auto r1 = sol.dailyTemperatures(t1); cout << "CASE:1:OUT:"; printVec(r1); cout << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { vector<int> t2 = {30, 60, 90}; auto r2 = sol.dailyTemperatures(t2); cout << "CASE:2:OUT:"; printVec(r2); cout << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { vector<int> t3 = {89, 62, 70, 58, 47, 47, 46, 76, 100, 70}; auto r3 = sol.dailyTemperatures(t3); cout << "CASE:3:OUT:"; printVec(r3); cout << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '[1, 1, 4, 2, 1, 1, 0, 0]', 1: '[1, 1, 1, 0]', 2: '[1, 1, 0]', 3: '[8, 1, 5, 4, 3, 2, 1, 1, 0, 0]' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1',                    inputDisplay: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]' },
      { id: 1, name: 'Example 2 (Strictly Ascending)',inputDisplay: 'temperatures = [30, 40, 50, 60]' },
      { id: 2, name: 'Example 3 (Steep rise)',       inputDisplay: 'temperatures = [30, 60, 90]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'evaluate-reverse-polish-notation': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
#include <string>
#include <stack>
using namespace std;

${userCode}

int main() {
    Solution sol;

    try { vector<string> t0 = {"2", "1", "+", "3", "*"}; cout << "CASE:0:OUT:" << sol.evalRPN(t0) << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { vector<string> t1 = {"4", "13", "5", "/", "+"}; cout << "CASE:1:OUT:" << sol.evalRPN(t1) << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { vector<string> t2 = {"10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"}; cout << "CASE:2:OUT:" << sol.evalRPN(t2) << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { vector<string> t3 = {"3", "-4", "+"}; cout << "CASE:3:OUT:" << sol.evalRPN(t3) << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '9', 1: '6', 2: '22', 3: '-1' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1',                    inputDisplay: 'tokens = ["2", "1", "+", "3", "*"]' },
      { id: 1, name: 'Example 2 (Integer division)', inputDisplay: 'tokens = ["4", "13", "5", "/", "+"]' },
      { id: 2, name: 'Example 3 (Complex postfix)',  inputDisplay: 'tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'linked-list-cycle': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

${userCode}

ListNode* makeCycleList(const vector<int>& vals, int pos) {
    if (vals.empty()) return nullptr;
    vector<ListNode*> nodes;
    for (int v : vals) nodes.push_back(new ListNode(v));
    for (size_t i = 0; i + 1 < nodes.size(); ++i) nodes[i]->next = nodes[i+1];
    if (pos >= 0 && pos < (int)nodes.size()) nodes.back()->next = nodes[pos];
    return nodes[0];
}

int main() {
    Solution sol;

    try { ListNode* h0 = makeCycleList({3, 2, 0, -4}, 1); cout << "CASE:0:OUT:" << (sol.hasCycle(h0) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { ListNode* h1 = makeCycleList({1, 2}, 0); cout << "CASE:1:OUT:" << (sol.hasCycle(h1) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { ListNode* h2 = makeCycleList({1}, -1); cout << "CASE:2:OUT:" << (sol.hasCycle(h2) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { ListNode* h3 = makeCycleList({-1, -7, 7, -4, 19}, -1); cout << "CASE:3:OUT:" << (sol.hasCycle(h3) ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: 'true', 1: 'true', 2: 'false', 3: 'false' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Cycle to pos 1)',   inputDisplay: 'head = [3, 2, 0, -4], pos = 1' },
      { id: 1, name: 'Example 2 (Cycle to pos 0)',   inputDisplay: 'head = [1, 2], pos = 0' },
      { id: 2, name: 'Example 3 (Single node, no cycle)', inputDisplay: 'head = [1], pos = -1' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'middle-of-the-linked-list': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

${userCode}

ListNode* makeList(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < vals.size(); ++i) {
        curr->next = new ListNode(vals[i]);
        curr = curr->next;
    }
    return head;
}

void printList(ListNode* head) {
    cout << "[";
    while (head) {
        cout << head->val << (head->next ? ", " : "");
        head = head->next;
    }
    cout << "]";
}

int main() {
    Solution sol;

    try { ListNode* h0 = makeList({1, 2, 3, 4, 5}); auto r0 = sol.middleNode(h0); cout << "CASE:0:OUT:"; printList(r0); cout << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { ListNode* h1 = makeList({1, 2, 3, 4, 5, 6}); auto r1 = sol.middleNode(h1); cout << "CASE:1:OUT:"; printList(r1); cout << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { ListNode* h2 = makeList({1}); auto r2 = sol.middleNode(h2); cout << "CASE:2:OUT:"; printList(r2); cout << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { ListNode* h3 = makeList({10, 20}); auto r3 = sol.middleNode(h3); cout << "CASE:3:OUT:"; printList(r3); cout << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '[3, 4, 5]', 1: '[4, 5, 6]', 2: '[1]', 3: '[20]' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Odd length)',       inputDisplay: 'head = [1, 2, 3, 4, 5]' },
      { id: 1, name: 'Example 2 (Even length)',      inputDisplay: 'head = [1, 2, 3, 4, 5, 6]' },
      { id: 2, name: 'Edge Case (Single node)',      inputDisplay: 'head = [1]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'same-tree': {
    buildHarness(userCode) {
      return `
#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

${userCode}

int main() {
    Solution sol;

    try {
        TreeNode* p0 = new TreeNode(1); p0->left = new TreeNode(2); p0->right = new TreeNode(3);
        TreeNode* q0 = new TreeNode(1); q0->left = new TreeNode(2); q0->right = new TreeNode(3);
        cout << "CASE:0:OUT:" << (sol.isSameTree(p0, q0) ? "true" : "false") << endl;
    } catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try {
        TreeNode* p1 = new TreeNode(1); p1->left = new TreeNode(2);
        TreeNode* q1 = new TreeNode(1); q1->right = new TreeNode(2);
        cout << "CASE:1:OUT:" << (sol.isSameTree(p1, q1) ? "true" : "false") << endl;
    } catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try {
        TreeNode* p2 = new TreeNode(1); p2->left = new TreeNode(2); p2->right = new TreeNode(1);
        TreeNode* q2 = new TreeNode(1); q2->left = new TreeNode(1); q2->right = new TreeNode(2);
        cout << "CASE:2:OUT:" << (sol.isSameTree(p2, q2) ? "true" : "false") << endl;
    } catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try {
        cout << "CASE:3:OUT:" << (sol.isSameTree(nullptr, nullptr) ? "true" : "false") << endl;
    } catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: 'true', 1: 'false', 2: 'false', 3: 'true' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Identical trees)',  inputDisplay: 'p = [1, 2, 3], q = [1, 2, 3]' },
      { id: 1, name: 'Example 2 (Structural diff)',  inputDisplay: 'p = [1, 2], q = [1, null, 2]' },
      { id: 2, name: 'Example 3 (Value mismatch)',   inputDisplay: 'p = [1, 2, 1], q = [1, 1, 2]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'invert-binary-tree': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
#include <queue>
#include <string>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

${userCode}

void printTree(TreeNode* root) {
    if (!root) { cout << "[]"; return; }
    vector<string> parts;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* curr = q.front(); q.pop();
        if (curr) {
            parts.push_back(to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        } else {
            parts.push_back("null");
        }
    }
    while (!parts.empty() && parts.back() == "null") parts.pop_back();
    cout << "[";
    for (size_t i = 0; i < parts.size(); ++i) {
        cout << parts[i] << (i + 1 < parts.size() ? ", " : "");
    }
    cout << "]";
}

int main() {
    Solution sol;

    try {
        TreeNode* r0 = new TreeNode(4);
        r0->left = new TreeNode(2); r0->right = new TreeNode(7);
        r0->left->left = new TreeNode(1); r0->left->right = new TreeNode(3);
        r0->right->left = new TreeNode(6); r0->right->right = new TreeNode(9);
        auto inv0 = sol.invertTree(r0);
        cout << "CASE:0:OUT:"; printTree(inv0); cout << endl;
    } catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try {
        TreeNode* r1 = new TreeNode(2);
        r1->left = new TreeNode(1); r1->right = new TreeNode(3);
        auto inv1 = sol.invertTree(r1);
        cout << "CASE:1:OUT:"; printTree(inv1); cout << endl;
    } catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try {
        auto inv2 = sol.invertTree(nullptr);
        cout << "CASE:2:OUT:"; printTree(inv2); cout << endl;
    } catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try {
        TreeNode* r3 = new TreeNode(1);
        r3->left = new TreeNode(2);
        auto inv3 = sol.invertTree(r3);
        cout << "CASE:3:OUT:"; printTree(inv3); cout << endl;
    } catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '[4, 7, 2, 9, 6, 3, 1]', 1: '[2, 3, 1]', 2: '[]', 3: '[1, null, 2]' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Full binary tree)', isHidden: false, inputDisplay: 'root = [4, 2, 7, 1, 3, 6, 9]' },
      { id: 1, name: 'Example 2 (3-node tree)',      isHidden: false, inputDisplay: 'root = [2, 1, 3]' },
      { id: 2, name: 'Edge Case (Empty tree)',       isHidden: false, inputDisplay: 'root = []' },
      { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
    ],
  },

  'longest-substring-without-repeating-characters': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

\${userCode}

int main() {
    Solution sol;

    try { cout << "CASE:0:OUT:" << sol.lengthOfLongestSubstring("abcabcbb") << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { cout << "CASE:1:OUT:" << sol.lengthOfLongestSubstring("bbbbb") << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { cout << "CASE:2:OUT:" << sol.lengthOfLongestSubstring("pwwkew") << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { cout << "CASE:3:OUT:" << sol.lengthOfLongestSubstring("dvdf") << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '3', 1: '1', 2: '3', 3: '3' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (abc)',              inputDisplay: 's = "abcabcbb"' },
      { id: 1, name: 'Example 2 (Single repeat char)',inputDisplay: 's = "bbbbb"' },
      { id: 2, name: 'Example 3 (Subsequence trap)', inputDisplay: 's = "pwwkew"' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'binary-search': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

\${userCode}

int main() {
    Solution sol;

    try { vector<int> a0 = {-1, 0, 3, 5, 9, 12}; cout << "CASE:0:OUT:" << sol.search(a0, 9) << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { vector<int> a1 = {-1, 0, 3, 5, 9, 12}; cout << "CASE:1:OUT:" << sol.search(a1, 2) << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { vector<int> a2 = {5}; cout << "CASE:2:OUT:" << sol.search(a2, 5) << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { vector<int> a3 = {2, 5}; cout << "CASE:3:OUT:" << sol.search(a3, 0) << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '4', 1: '-1', 2: '0', 3: '-1' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Found)',            inputDisplay: 'nums = [-1, 0, 3, 5, 9, 12], target = 9' },
      { id: 1, name: 'Example 2 (Not Found)',        inputDisplay: 'nums = [-1, 0, 3, 5, 9, 12], target = 2' },
      { id: 2, name: 'Edge Case (Single element)',   inputDisplay: 'nums = [5], target = 5' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'search-in-rotated-sorted-array': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

\${userCode}

int main() {
    Solution sol;

    try { vector<int> a0 = {4, 5, 6, 7, 0, 1, 2}; cout << "CASE:0:OUT:" << sol.search(a0, 0) << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { vector<int> a1 = {4, 5, 6, 7, 0, 1, 2}; cout << "CASE:1:OUT:" << sol.search(a1, 3) << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { vector<int> a2 = {1}; cout << "CASE:2:OUT:" << sol.search(a2, 0) << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { vector<int> a3 = {3, 1}; cout << "CASE:3:OUT:" << sol.search(a3, 1) << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '4', 1: '-1', 2: '-1', 3: '1' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Found in rotated)', inputDisplay: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 0' },
      { id: 1, name: 'Example 2 (Not in array)',     inputDisplay: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 3' },
      { id: 2, name: 'Edge Case (Single element)',   inputDisplay: 'nums = [1], target = 0' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'reverse-linked-list': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

\${userCode}

ListNode* makeList(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < vals.size(); ++i) {
        curr->next = new ListNode(vals[i]);
        curr = curr->next;
    }
    return head;
}

void printList(ListNode* head) {
    cout << "[";
    while (head) {
        cout << head->val << (head->next ? ", " : "");
        head = head->next;
    }
    cout << "]";
}

int main() {
    Solution sol;

    try { ListNode* h0 = makeList({1, 2, 3, 4, 5}); auto r0 = sol.reverseList(h0); cout << "CASE:0:OUT:"; printList(r0); cout << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { ListNode* h1 = makeList({1, 2}); auto r1 = sol.reverseList(h1); cout << "CASE:1:OUT:"; printList(r1); cout << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { ListNode* h2 = makeList({}); auto r2 = sol.reverseList(h2); cout << "CASE:2:OUT:"; printList(r2); cout << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { ListNode* h3 = makeList({1}); auto r3 = sol.reverseList(h3); cout << "CASE:3:OUT:"; printList(r3); cout << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '[5, 4, 3, 2, 1]', 1: '[2, 1]', 2: '[]', 3: '[1]' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (5 nodes)',          inputDisplay: 'head = [1, 2, 3, 4, 5]' },
      { id: 1, name: 'Example 2 (2 nodes)',          inputDisplay: 'head = [1, 2]' },
      { id: 2, name: 'Edge Case (Empty list)',       inputDisplay: 'head = []' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'merge-two-sorted-lists': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

\${userCode}

ListNode* makeList(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < vals.size(); ++i) {
        curr->next = new ListNode(vals[i]);
        curr = curr->next;
    }
    return head;
}

void printList(ListNode* head) {
    cout << "[";
    while (head) {
        cout << head->val << (head->next ? ", " : "");
        head = head->next;
    }
    cout << "]";
}

int main() {
    Solution sol;

    try { ListNode* l1 = makeList({1, 2, 4}); ListNode* l2 = makeList({1, 3, 4}); auto r0 = sol.mergeTwoLists(l1, l2); cout << "CASE:0:OUT:"; printList(r0); cout << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { ListNode* l1 = makeList({}); ListNode* l2 = makeList({}); auto r1 = sol.mergeTwoLists(l1, l2); cout << "CASE:1:OUT:"; printList(r1); cout << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { ListNode* l1 = makeList({}); ListNode* l2 = makeList({0}); auto r2 = sol.mergeTwoLists(l1, l2); cout << "CASE:2:OUT:"; printList(r2); cout << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { ListNode* l1 = makeList({2}); ListNode* l2 = makeList({1}); auto r3 = sol.mergeTwoLists(l1, l2); cout << "CASE:3:OUT:"; printList(r3); cout << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '[1, 1, 2, 3, 4, 4]', 1: '[]', 2: '[0]', 3: '[1, 2]' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Non-empty lists)',  inputDisplay: 'list1 = [1, 2, 4], list2 = [1, 3, 4]' },
      { id: 1, name: 'Example 2 (Both empty)',       inputDisplay: 'list1 = [], list2 = []' },
      { id: 2, name: 'Edge Case (One empty)',        inputDisplay: 'list1 = [], list2 = [0]' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'valid-parentheses': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <string>
#include <stack>
using namespace std;

\${userCode}

int main() {
    Solution sol;

    try { cout << "CASE:0:OUT:" << (sol.isValid("()") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try { cout << "CASE:1:OUT:" << (sol.isValid("()[]{}") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try { cout << "CASE:2:OUT:" << (sol.isValid("(]") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try { cout << "CASE:3:OUT:" << (sol.isValid("([)]") ? "true" : "false") << endl; }
    catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: 'true', 1: 'true', 2: 'false', 3: 'false' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Simple pair)',      inputDisplay: 's = "()"' },
      { id: 1, name: 'Example 2 (Multiple types)',   inputDisplay: 's = "()[]{}"' },
      { id: 2, name: 'Example 3 (Mismatched type)',  inputDisplay: 's = "(]"' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },

  'maximum-depth-of-binary-tree': {
    buildHarness(userCode) {
      return `
#include <iostream>
#include <algorithm>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

\${userCode}

int main() {
    Solution sol;

    try {
        TreeNode* r0 = new TreeNode(3);
        r0->left = new TreeNode(9);
        r0->right = new TreeNode(20);
        r0->right->left = new TreeNode(15);
        r0->right->right = new TreeNode(7);
        cout << "CASE:0:OUT:" << sol.maxDepth(r0) << endl;
    } catch(...) { cout << "CASE:0:ERROR:Exception thrown" << endl; }

    try {
        TreeNode* r1 = new TreeNode(1);
        r1->right = new TreeNode(2);
        cout << "CASE:1:OUT:" << sol.maxDepth(r1) << endl;
    } catch(...) { cout << "CASE:1:ERROR:Exception thrown" << endl; }

    try {
        cout << "CASE:2:OUT:" << sol.maxDepth(nullptr) << endl;
    } catch(...) { cout << "CASE:2:ERROR:Exception thrown" << endl; }

    // HIDDEN
    try {
        TreeNode* r3 = new TreeNode(0);
        cout << "CASE:3:OUT:" << sol.maxDepth(r3) << endl;
    } catch(...) { cout << "CASE:3:ERROR:Exception thrown" << endl; }

    return 0;
}
`;
    },
    expectedOutputs: { 0: '3', 1: '2', 2: '0', 3: '1' },
    hiddenIds: new Set([3]),
    totalCount: 4,
    publicCases: [
      { id: 0, name: 'Example 1 (Depth 3)',          inputDisplay: 'root = [3, 9, 20, null, null, 15, 7]' },
      { id: 1, name: 'Example 2 (Depth 2)',          inputDisplay: 'root = [1, null, 2]' },
      { id: 2, name: 'Edge Case (Empty tree)',       inputDisplay: 'root = []' },
      { id: 3, name: 'Hidden Test',                  inputDisplay: null },
    ],
  },
};

// ─── Grading ─────────────────────────────────────────────────────────────────

function normalise(s) {
  return String(s).replace(/\r\n/g, '\n').trim().toLowerCase().replace(/\s+/g, '');
}

function compareOutputs(actual, expected) {
  if (actual == null || expected == null) return false;
  return normalise(actual) === normalise(expected);
}

/**
 * Parse raw program stdout into per-test-case results.
 * Returns an array of result objects safe to send to the browser
 * (hidden inputs and expected outputs are stripped).
 */
function gradeOutput(suite, rawOutput) {
  const output = rawOutput || '';
  let passedCount = 0;
  const results = [];

  for (const tc of suite.publicCases) {
    const outMatch = output.match(new RegExp(`CASE:${tc.id}:OUT:(.*)`));
    const errMatch = output.match(new RegExp(`CASE:${tc.id}:ERROR:(.*)`));

    const expected = suite.expectedOutputs[tc.id];
    const isHidden = suite.hiddenIds.has(tc.id);

    let actual = '';
    let passed = false;
    let error = null;

    if (errMatch) {
      error  = errMatch[1].trim();
      actual = `Exception: ${error}`;
    } else if (outMatch) {
      actual = outMatch[1].trim();
      passed = compareOutputs(actual, expected);
    } else {
      actual = 'No output generated';
    }

    if (passed) passedCount++;

    results.push({
      id:             tc.id,
      name:           tc.name,
      isHidden,
      passed,
      error,
      // Never reveal hidden inputs or expected outputs to the browser
      inputDisplay:   isHidden ? 'Hidden test input'         : tc.inputDisplay,
      expectedOutput: isHidden ? '[Protected]'               : expected,
      actualOutput:   isHidden ? (passed ? '[Correct]' : '[Incorrect]') : actual,
    });
  }

  return { passedCount, results };
}

module.exports = { TEST_SUITES, gradeOutput, compareOutputs };
