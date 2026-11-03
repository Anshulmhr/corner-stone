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

const { isDeepStrictEqual } = require('node:util');

// ─── Per-problem test suites ──────────────────────────────────────────────────

// One sandbox job returns one value. Keep the answer separate from student
// stdout (including printf and code that changes iostream synchronization).
function caseMain(body) {
  return `
#include <cstdio>
#include <sstream>
#ifdef _WIN32
#include <io.h>
#else
#include <unistd.h>
#endif

int main() {
#ifdef _WIN32
    FILE* verdict = _fdopen(_dup(_fileno(stdout)), "w");
    if (!verdict || _dup2(_fileno(stderr), _fileno(stdout)) != 0) return 1;
#else
    FILE* verdict = fdopen(dup(fileno(stdout)), "w");
    if (!verdict || dup2(fileno(stderr), fileno(stdout)) < 0) return 1;
#endif
    std::ostringstream out;
    Solution sol;
    ${body}
    std::fprintf(verdict, "%s", out.str().c_str());
    return std::fclose(verdict) == 0 ? 0 : 1;
}`;
}

const TEST_SUITES = {
  'two-sum': {
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> n = {2, 7, 11, 15};
         auto r = sol.twoSum(n, 9);
         if (r.size() == 2) {
             int a = min(r[0], r[1]), b = max(r[0], r[1]);
             out << "[" << a << ", " << b << "]";
         } else { out << "[]"; }`,
        `vector<int> n = {3, 2, 4};
         auto r = sol.twoSum(n, 6);
         if (r.size() == 2) {
             int a = min(r[0], r[1]), b = max(r[0], r[1]);
             out << "[" << a << ", " << b << "]";
         } else { out << "[]"; }`,
        `vector<int> n = {3, 3};
         auto r = sol.twoSum(n, 6);
         if (r.size() == 2) {
             int a = min(r[0], r[1]), b = max(r[0], r[1]);
             out << "[" << a << ", " << b << "]";
         } else { out << "[]"; }`,
        `vector<int> n = {-3, 4, 3, 90};
         auto r = sol.twoSum(n, 0);
         if (r.size() == 2) {
             int a = min(r[0], r[1]), b = max(r[0], r[1]);
             out << "[" << a << ", " << b << "]";
         } else { out << "[]"; }`
      ];
      return `
#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <algorithm>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> p={7,1,5,3,6,4};
         out << sol.maxProfit(p);`,
        `vector<int> p={7,6,4,3,1};
         out << sol.maxProfit(p);`,
        `vector<int> p={2,4,1};
         out << sol.maxProfit(p);`,
        `vector<int> p={1,2};
         out << sol.maxProfit(p);`
      ];
      return `
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `bool r=sol.isAnagram("anagram","nagaram");
         out << (r?"true":"false");`,
        `bool r=sol.isAnagram("rat","car");
         out << (r?"true":"false");`,
        `bool r=sol.isAnagram("a","ab");
         out << (r?"true":"false");`,
        `bool r=sol.isAnagram("listen","silent");
         out << (r?"true":"false");`
      ];
      return `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> n = {1, 2, 3, 1};
         out << (sol.containsDuplicate(n) ? "true" : "false");`,
        `vector<int> n = {1, 2, 3, 4};
         out << (sol.containsDuplicate(n) ? "true" : "false");`,
        `vector<int> n = {1, 1, 1, 3, 3, 4, 3, 2, 4, 2};
         out << (sol.containsDuplicate(n) ? "true" : "false");`,
        `vector<int> n = {-1, -2, -3, -1};
         out << (sol.containsDuplicate(n) ? "true" : "false");`
      ];
      return `
#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> n = {1, 2, 3, 4};
         auto r = sol.productExceptSelf(n);
         printVec(out, r);`,
        `vector<int> n = {-1, 1, 0, -3, 3};
         auto r = sol.productExceptSelf(n);
         printVec(out, r);`,
        `vector<int> n = {2, 3};
         auto r = sol.productExceptSelf(n);
         printVec(out, r);`,
        `vector<int> n = {0, 0};
         auto r = sol.productExceptSelf(n);
         printVec(out, r);`
      ];
      return `
#include <iostream>
#include <vector>
using namespace std;

${userCode}

void printVec(ostream& out, const vector<int>& v) {
    out << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        out << v[i] << (i + 1 < v.size() ? ", " : "");
    }
    out << "]";
}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `out << (sol.isPalindrome("A man, a plan, a canal: Panama") ? "true" : "false");`,
        `out << (sol.isPalindrome("race a car") ? "true" : "false");`,
        `out << (sol.isPalindrome(" ") ? "true" : "false");`,
        `out << (sol.isPalindrome("0P") ? "true" : "false");`
      ];
      return `
#include <iostream>
#include <string>
#include <cctype>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> n = {3, 4, 5, 1, 2};
         out << sol.findMin(n);`,
        `vector<int> n = {4, 5, 6, 7, 0, 1, 2};
         out << sol.findMin(n);`,
        `vector<int> n = {11, 13, 15, 17};
         out << sol.findMin(n);`,
        `vector<int> n = {2, 1};
         out << sol.findMin(n);`
      ];
      return `
#include <iostream>
#include <vector>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> t = {73, 74, 75, 71, 69, 72, 76, 73};
         auto r = sol.dailyTemperatures(t);
         printVec(out, r);`,
        `vector<int> t = {30, 40, 50, 60};
         auto r = sol.dailyTemperatures(t);
         printVec(out, r);`,
        `vector<int> t = {30, 60, 90};
         auto r = sol.dailyTemperatures(t);
         printVec(out, r);`,
        `vector<int> t = {89, 62, 70, 58, 47, 47, 46, 76, 100, 70};
         auto r = sol.dailyTemperatures(t);
         printVec(out, r);`
      ];
      return `
#include <iostream>
#include <vector>
#include <stack>
using namespace std;

${userCode}

void printVec(ostream& out, const vector<int>& v) {
    out << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        out << v[i] << (i + 1 < v.size() ? ", " : "");
    }
    out << "]";
}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<string> t = {"2", "1", "+", "3", "*"};
         out << sol.evalRPN(t);`,
        `vector<string> t = {"4", "13", "5", "/", "+"};
         out << sol.evalRPN(t);`,
        `vector<string> t = {"10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"};
         out << sol.evalRPN(t);`,
        `vector<string> t = {"3", "-4", "+"};
         out << sol.evalRPN(t);`
      ];
      return `
#include <iostream>
#include <vector>
#include <string>
#include <stack>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `ListNode* h = makeCycleList({3, 2, 0, -4}, 1);
         out << (sol.hasCycle(h) ? "true" : "false");`,
        `ListNode* h = makeCycleList({1, 2}, 0);
         out << (sol.hasCycle(h) ? "true" : "false");`,
        `ListNode* h = makeCycleList({1}, -1);
         out << (sol.hasCycle(h) ? "true" : "false");`,
        `ListNode* h = makeCycleList({-1, -7, 7, -4, 19}, -1);
         out << (sol.hasCycle(h) ? "true" : "false");`
      ];
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

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `ListNode* h = makeList({1, 2, 3, 4, 5});
         auto r = sol.middleNode(h);
         printList(out, r);`,
        `ListNode* h = makeList({1, 2, 3, 4, 5, 6});
         auto r = sol.middleNode(h);
         printList(out, r);`,
        `ListNode* h = makeList({1});
         auto r = sol.middleNode(h);
         printList(out, r);`,
        `ListNode* h = makeList({10, 20});
         auto r = sol.middleNode(h);
         printList(out, r);`
      ];
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

void printList(ostream& out, ListNode* head) {
    out << "[";
    while (head) {
        out << head->val << (head->next ? ", " : "");
        head = head->next;
    }
    out << "]";
}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `TreeNode* p = new TreeNode(1); p->left = new TreeNode(2); p->right = new TreeNode(3);
         TreeNode* q = new TreeNode(1); q->left = new TreeNode(2); q->right = new TreeNode(3);
         out << (sol.isSameTree(p, q) ? "true" : "false");`,
        `TreeNode* p = new TreeNode(1); p->left = new TreeNode(2);
         TreeNode* q = new TreeNode(1); q->right = new TreeNode(2);
         out << (sol.isSameTree(p, q) ? "true" : "false");`,
        `TreeNode* p = new TreeNode(1); p->left = new TreeNode(2); p->right = new TreeNode(1);
         TreeNode* q = new TreeNode(1); q->left = new TreeNode(1); q->right = new TreeNode(2);
         out << (sol.isSameTree(p, q) ? "true" : "false");`,
        `out << (sol.isSameTree(nullptr, nullptr) ? "true" : "false");`
      ];
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

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `TreeNode* r = new TreeNode(4);
         r->left = new TreeNode(2); r->right = new TreeNode(7);
         r->left->left = new TreeNode(1); r->left->right = new TreeNode(3);
         r->right->left = new TreeNode(6); r->right->right = new TreeNode(9);
         auto inv = sol.invertTree(r);
         printTree(out, inv);`,
        `TreeNode* r = new TreeNode(2);
         r->left = new TreeNode(1); r->right = new TreeNode(3);
         auto inv = sol.invertTree(r);
         printTree(out, inv);`,
        `auto inv = sol.invertTree(nullptr);
         printTree(out, inv);`,
        `TreeNode* r = new TreeNode(1);
         r->left = new TreeNode(2);
         auto inv = sol.invertTree(r);
         printTree(out, inv);`
      ];
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

void printTree(ostream& out, TreeNode* root) {
    if (!root) { out << "[]"; return; }
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
    out << "[";
    for (size_t i = 0; i < parts.size(); ++i) {
        out << parts[i] << (i + 1 < parts.size() ? ", " : "");
    }
    out << "]";
}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `out << sol.lengthOfLongestSubstring("abcabcbb");`,
        `out << sol.lengthOfLongestSubstring("bbbbb");`,
        `out << sol.lengthOfLongestSubstring("pwwkew");`,
        `out << sol.lengthOfLongestSubstring("dvdf");`
      ];
      return `
#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> a = {-1, 0, 3, 5, 9, 12};
         out << sol.search(a, 9);`,
        `vector<int> a = {-1, 0, 3, 5, 9, 12};
         out << sol.search(a, 2);`,
        `vector<int> a = {5};
         out << sol.search(a, 5);`,
        `vector<int> a = {2, 5};
         out << sol.search(a, 0);`
      ];
      return `
#include <iostream>
#include <vector>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `vector<int> a = {4, 5, 6, 7, 0, 1, 2};
         out << sol.search(a, 0);`,
        `vector<int> a = {4, 5, 6, 7, 0, 1, 2};
         out << sol.search(a, 3);`,
        `vector<int> a = {1};
         out << sol.search(a, 0);`,
        `vector<int> a = {3, 1};
         out << sol.search(a, 1);`
      ];
      return `
#include <iostream>
#include <vector>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `ListNode* h = makeList({1, 2, 3, 4, 5});
         auto r = sol.reverseList(h);
         printList(out, r);`,
        `ListNode* h = makeList({1, 2});
         auto r = sol.reverseList(h);
         printList(out, r);`,
        `ListNode* h = makeList({});
         auto r = sol.reverseList(h);
         printList(out, r);`,
        `ListNode* h = makeList({1});
         auto r = sol.reverseList(h);
         printList(out, r);`
      ];
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

void printList(ostream& out, ListNode* head) {
    out << "[";
    while (head) {
        out << head->val << (head->next ? ", " : "");
        head = head->next;
    }
    out << "]";
}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `ListNode* l1 = makeList({1, 2, 4});
         ListNode* l2 = makeList({1, 3, 4});
         auto r = sol.mergeTwoLists(l1, l2);
         printList(out, r);`,
        `ListNode* l1 = makeList({});
         ListNode* l2 = makeList({});
         auto r = sol.mergeTwoLists(l1, l2);
         printList(out, r);`,
        `ListNode* l1 = makeList({});
         ListNode* l2 = makeList({0});
         auto r = sol.mergeTwoLists(l1, l2);
         printList(out, r);`,
        `ListNode* l1 = makeList({2});
         ListNode* l2 = makeList({1});
         auto r = sol.mergeTwoLists(l1, l2);
         printList(out, r);`
      ];
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

void printList(ostream& out, ListNode* head) {
    out << "[";
    while (head) {
        out << head->val << (head->next ? ", " : "");
        head = head->next;
    }
    out << "]";
}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `out << (sol.isValid("()") ? "true" : "false");`,
        `out << (sol.isValid("()[]{}") ? "true" : "false");`,
        `out << (sol.isValid("(]") ? "true" : "false");`,
        `out << (sol.isValid("([)]") ? "true" : "false");`
      ];
      return `
#include <iostream>
#include <string>
#include <stack>
using namespace std;

${userCode}

${caseMain(cases[caseId])}
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
    buildHarness(userCode, caseId) {
      const cases = [
        `TreeNode* r = new TreeNode(3);
         r->left = new TreeNode(9);
         r->right = new TreeNode(20);
         r->right->left = new TreeNode(15);
         r->right->right = new TreeNode(7);
         out << sol.maxDepth(r);`,
        `TreeNode* r = new TreeNode(1);
         r->right = new TreeNode(2);
         out << sol.maxDepth(r);`,
        `out << sol.maxDepth(nullptr);`,
        `TreeNode* r = new TreeNode(0);
         out << sol.maxDepth(r);`
      ];
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

${userCode}

${caseMain(cases[caseId])}
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

// The server associates each independent sandbox response with its own case.
function gradeCase(suite, tc, rawOutput) {
  const actual = (rawOutput || '').trim();
  const expected = suite.expectedOutputs[tc.id];
  let passed = false;
  try {
    passed = isDeepStrictEqual(JSON.parse(actual), JSON.parse(expected));
  } catch {
    // Empty output, extra records and malformed JSON are all wrong answers.
  }

  const isHidden = suite.hiddenIds.has(tc.id);
  return {
    id: tc.id,
    name: tc.name,
    isHidden,
    passed,
    error: null,
    inputDisplay: isHidden ? 'Hidden test input' : tc.inputDisplay,
    expectedOutput: isHidden ? '[Protected]' : expected,
    actualOutput: isHidden ? (passed ? '[Correct]' : '[Incorrect]') : (actual || 'No output generated'),
  };
}

module.exports = { TEST_SUITES, gradeCase };
