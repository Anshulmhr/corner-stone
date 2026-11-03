/**
 * FRONTEND-SAFE module — no hidden test data, no harnesses, no grading logic.
 *
 * Contains only:
 *  - The list of problem IDs that support C++ evaluation
 *  - Per-problem starter code for the editor
 *  - VISIBLE test case display metadata (input only, NO expectedOutput for hidden)
 *
 * All hidden test inputs, expected outputs, harness assembly, and grading
 * live exclusively in server/testSuites.js and never reach the browser.
 */

export const CPP_SUPPORTED_PROBLEMS = [
  'two-sum',
  'best-time-to-buy-and-sell-stock',
  'valid-anagram',
  'longest-substring-without-repeating-characters',
  'binary-search',
  'search-in-rotated-sorted-array',
  'reverse-linked-list',
  'merge-two-sorted-lists',
  'valid-parentheses',
  'maximum-depth-of-binary-tree',
  'contains-duplicate',
  'product-of-array-except-self',
  'valid-palindrome',
  'find-minimum-in-rotated-sorted-array',
  'daily-temperatures',
  'evaluate-reverse-polish-notation',
  'linked-list-cycle',
  'middle-of-the-linked-list',
  'same-tree',
  'invert-binary-tree'
];

// Starter code shown in Monaco Editor — no test data
export const CPP_STARTER_CODE = {
  'two-sum': `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here

    }
};
`,

  'best-time-to-buy-and-sell-stock': `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your solution here

    }
};
`,

  'valid-anagram': `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        // Write your solution here

    }
};
`,

  'contains-duplicate': `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Write your solution here

    }
};
`,

  'product-of-array-except-self': `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        // Write your solution here

    }
};
`,

  'valid-palindrome': `#include <string>
#include <cctype>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        // Write your solution here

    }
};
`,

  'find-minimum-in-rotated-sorted-array': `#include <vector>
using namespace std;

class Solution {
public:
    int findMin(vector<int>& nums) {
        // Write your solution here

    }
};
`,

  'daily-temperatures': `#include <vector>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        // Write your solution here

    }
};
`,

  'evaluate-reverse-polish-notation': `#include <vector>
#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        // Write your solution here

    }
};
`,

  'linked-list-cycle': `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    bool hasCycle(ListNode *head) {
        // Write your solution here

    }
};
`,

  'middle-of-the-linked-list': `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    ListNode* middleNode(ListNode* head) {
        // Write your solution here

    }
};
`,

  'same-tree': `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        // Write your solution here

    }
};
`,

  'invert-binary-tree': `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        // Write your solution here

    }
};
`,

  'longest-substring-without-repeating-characters': `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your solution here

    }
};
`,

  'binary-search': `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Write your solution here

    }
};
`,

  'search-in-rotated-sorted-array': `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Write your solution here

    }
};
`,

  'reverse-linked-list': `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Write your solution here

    }
};
`,

  'merge-two-sorted-lists': `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        // Write your solution here

    }
};
`,

  'valid-parentheses': `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your solution here

    }
};
`,

  'maximum-depth-of-binary-tree': `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    int maxDepth(TreeNode* root) {
        // Write your solution here

    }
};
`,
};

/**
 * Visible test case display metadata — shown to the student before submission.
 * Hidden test cases are listed with name only so the UI can show the tab;
 * their inputs and expected outputs are NEVER included here.
 */
export const CPP_VISIBLE_CASES = {
  'two-sum': [
    { id: 0, name: 'Example 1',                  isHidden: false, inputDisplay: 'nums = [2, 7, 11, 15], target = 9' },
    { id: 1, name: 'Example 2',                  isHidden: false, inputDisplay: 'nums = [3, 2, 4], target = 6'      },
    { id: 2, name: 'Example 3 (Duplicate values)', isHidden: false, inputDisplay: 'nums = [3, 3], target = 6'       },
    { id: 3, name: 'Hidden Test',                 isHidden: true,  inputDisplay: null                               },
  ],

  'best-time-to-buy-and-sell-stock': [
    { id: 0, name: 'Example 1',                     isHidden: false, inputDisplay: 'prices = [7, 1, 5, 3, 6, 4]' },
    { id: 1, name: 'Example 2 (Decreasing Prices)',  isHidden: false, inputDisplay: 'prices = [7, 6, 4, 3, 1]'   },
    { id: 2, name: 'Edge Case (Valley at end)',       isHidden: false, inputDisplay: 'prices = [2, 4, 1]'         },
    { id: 3, name: 'Hidden Test',                    isHidden: true,  inputDisplay: null                          },
  ],

  'valid-anagram': [
    { id: 0, name: 'Example 1',                    isHidden: false, inputDisplay: 's = "anagram", t = "nagaram"' },
    { id: 1, name: 'Example 2',                    isHidden: false, inputDisplay: 's = "rat", t = "car"'         },
    { id: 2, name: 'Edge Case (Different lengths)', isHidden: false, inputDisplay: 's = "a", t = "ab"'            },
    { id: 3, name: 'Hidden Test',                   isHidden: true,  inputDisplay: null                           },
  ],

  'contains-duplicate': [
    { id: 0, name: 'Example 1 (Has Duplicate)',    isHidden: false, inputDisplay: 'nums = [1, 2, 3, 1]' },
    { id: 1, name: 'Example 2 (All Distinct)',     isHidden: false, inputDisplay: 'nums = [1, 2, 3, 4]' },
    { id: 2, name: 'Example 3 (Multiple Dups)',    isHidden: false, inputDisplay: 'nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'product-of-array-except-self': [
    { id: 0, name: 'Example 1',                    isHidden: false, inputDisplay: 'nums = [1, 2, 3, 4]' },
    { id: 1, name: 'Example 2 (Contains Zero)',    isHidden: false, inputDisplay: 'nums = [-1, 1, 0, -3, 3]' },
    { id: 2, name: 'Edge Case (Two Elements)',     isHidden: false, inputDisplay: 'nums = [2, 3]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'valid-palindrome': [
    { id: 0, name: 'Example 1 (Panama phrase)',    isHidden: false, inputDisplay: 's = "A man, a plan, a canal: Panama"' },
    { id: 1, name: 'Example 2 (Non-palindrome)',   isHidden: false, inputDisplay: 's = "race a car"' },
    { id: 2, name: 'Edge Case (Whitespace string)',isHidden: false, inputDisplay: 's = " "' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'find-minimum-in-rotated-sorted-array': [
    { id: 0, name: 'Example 1',                    isHidden: false, inputDisplay: 'nums = [3, 4, 5, 1, 2]' },
    { id: 1, name: 'Example 2 (Pivot near start)', isHidden: false, inputDisplay: 'nums = [4, 5, 6, 7, 0, 1, 2]' },
    { id: 2, name: 'Edge Case (Already Sorted)',   isHidden: false, inputDisplay: 'nums = [11, 13, 15, 17]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'daily-temperatures': [
    { id: 0, name: 'Example 1',                    isHidden: false, inputDisplay: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]' },
    { id: 1, name: 'Example 2 (Strictly Ascending)',isHidden: false, inputDisplay: 'temperatures = [30, 40, 50, 60]' },
    { id: 2, name: 'Example 3 (Steep rise)',       isHidden: false, inputDisplay: 'temperatures = [30, 60, 90]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'evaluate-reverse-polish-notation': [
    { id: 0, name: 'Example 1',                    isHidden: false, inputDisplay: 'tokens = ["2", "1", "+", "3", "*"]' },
    { id: 1, name: 'Example 2 (Integer division)', isHidden: false, inputDisplay: 'tokens = ["4", "13", "5", "/", "+"]' },
    { id: 2, name: 'Example 3 (Complex postfix)',  isHidden: false, inputDisplay: 'tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'linked-list-cycle': [
    { id: 0, name: 'Example 1 (Cycle to pos 1)',   isHidden: false, inputDisplay: 'head = [3, 2, 0, -4], pos = 1' },
    { id: 1, name: 'Example 2 (Cycle to pos 0)',   isHidden: false, inputDisplay: 'head = [1, 2], pos = 0' },
    { id: 2, name: 'Example 3 (Single node, no cycle)', isHidden: false, inputDisplay: 'head = [1], pos = -1' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'middle-of-the-linked-list': [
    { id: 0, name: 'Example 1 (Odd length)',       isHidden: false, inputDisplay: 'head = [1, 2, 3, 4, 5]' },
    { id: 1, name: 'Example 2 (Even length)',      isHidden: false, inputDisplay: 'head = [1, 2, 3, 4, 5, 6]' },
    { id: 2, name: 'Edge Case (Single node)',      isHidden: false, inputDisplay: 'head = [1]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'same-tree': [
    { id: 0, name: 'Example 1 (Identical trees)',  isHidden: false, inputDisplay: 'p = [1, 2, 3], q = [1, 2, 3]' },
    { id: 1, name: 'Example 2 (Structural diff)',  isHidden: false, inputDisplay: 'p = [1, 2], q = [1, null, 2]' },
    { id: 2, name: 'Example 3 (Value mismatch)',   isHidden: false, inputDisplay: 'p = [1, 2, 1], q = [1, 1, 2]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'invert-binary-tree': [
    { id: 0, name: 'Example 1 (Full binary tree)', isHidden: false, inputDisplay: 'root = [4, 2, 7, 1, 3, 6, 9]' },
    { id: 1, name: 'Example 2 (3-node tree)',      isHidden: false, inputDisplay: 'root = [2, 1, 3]' },
    { id: 2, name: 'Edge Case (Empty tree)',       isHidden: false, inputDisplay: 'root = []' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'longest-substring-without-repeating-characters': [
    { id: 0, name: 'Example 1 (abc)',              isHidden: false, inputDisplay: 's = "abcabcbb"' },
    { id: 1, name: 'Example 2 (Single repeat char)',isHidden: false, inputDisplay: 's = "bbbbb"' },
    { id: 2, name: 'Example 3 (Subsequence trap)', isHidden: false, inputDisplay: 's = "pwwkew"' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'binary-search': [
    { id: 0, name: 'Example 1 (Found)',            isHidden: false, inputDisplay: 'nums = [-1, 0, 3, 5, 9, 12], target = 9' },
    { id: 1, name: 'Example 2 (Not Found)',        isHidden: false, inputDisplay: 'nums = [-1, 0, 3, 5, 9, 12], target = 2' },
    { id: 2, name: 'Edge Case (Single element)',   isHidden: false, inputDisplay: 'nums = [5], target = 5' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'search-in-rotated-sorted-array': [
    { id: 0, name: 'Example 1 (Found in rotated)', isHidden: false, inputDisplay: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 0' },
    { id: 1, name: 'Example 2 (Not in array)',     isHidden: false, inputDisplay: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 3' },
    { id: 2, name: 'Edge Case (Single element)',   isHidden: false, inputDisplay: 'nums = [1], target = 0' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'reverse-linked-list': [
    { id: 0, name: 'Example 1 (5 nodes)',          isHidden: false, inputDisplay: 'head = [1, 2, 3, 4, 5]' },
    { id: 1, name: 'Example 2 (2 nodes)',          isHidden: false, inputDisplay: 'head = [1, 2]' },
    { id: 2, name: 'Edge Case (Empty list)',       isHidden: false, inputDisplay: 'head = []' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'merge-two-sorted-lists': [
    { id: 0, name: 'Example 1 (Non-empty lists)',  isHidden: false, inputDisplay: 'list1 = [1, 2, 4], list2 = [1, 3, 4]' },
    { id: 1, name: 'Example 2 (Both empty)',       isHidden: false, inputDisplay: 'list1 = [], list2 = []' },
    { id: 2, name: 'Edge Case (One empty)',        isHidden: false, inputDisplay: 'list1 = [], list2 = [0]' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'valid-parentheses': [
    { id: 0, name: 'Example 1 (Simple pair)',      isHidden: false, inputDisplay: 's = "()"' },
    { id: 1, name: 'Example 2 (Multiple types)',   isHidden: false, inputDisplay: 's = "()[]{}"' },
    { id: 2, name: 'Example 3 (Mismatched type)',  isHidden: false, inputDisplay: 's = "(]"' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],

  'maximum-depth-of-binary-tree': [
    { id: 0, name: 'Example 1 (Depth 3)',          isHidden: false, inputDisplay: 'root = [3, 9, 20, null, null, 15, 7]' },
    { id: 1, name: 'Example 2 (Depth 2)',          isHidden: false, inputDisplay: 'root = [1, null, 2]' },
    { id: 2, name: 'Edge Case (Empty tree)',       isHidden: false, inputDisplay: 'root = []' },
    { id: 3, name: 'Hidden Test',                  isHidden: true,  inputDisplay: null },
  ],
};
