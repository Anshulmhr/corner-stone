export const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    summary: 'Find two indices in an array whose elements sum up to a specific target value.',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3, 3], target = 6',
        output: '[0, 1]',
        explanation: 'nums[0] + nums[1] == 6, returning [0, 1].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'A brute-force solution checks every pair with two nested loops in O(n²) time. Can you store numbers you have already visited so you can find their complement in O(1) time?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use a Hash Map (JavaScript Map or object). As you iterate through the array, the complement needed for current number `x` is `target - x`. Check if this complement already exists in your map.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Initialize `const map = new Map()`. Loop through `nums` with index `i`. Compute `complement = target - nums[i]`. If `map.has(complement)`, return `[map.get(complement), i]`. Otherwise, execute `map.set(nums[i], i)`. This guarantees an O(n) runtime and O(n) space.'
      }
    ]
  },
  {
    id: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Maximize profit by choosing a single day to buy and a different future day to sell a stock.',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      {
        input: 'prices = [7, 1, 5, 3, 6, 4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5. Note that buying on day 2 and selling on day 1 is not allowed.'
      },
      {
        input: 'prices = [7, 6, 4, 3, 1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.'
      }
    ],
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4'
    ],
    starterCode: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'You can only sell after you buy. As you scan through days from left to right, what is the best price to buy at so far?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Maintain two dynamic tracking variables during a single traversal: `minPrice` (the lowest price seen up to today) and `maxProfit` (the greatest difference between today\'s price and `minPrice`).'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Initialize `minPrice = Infinity` and `maxProfit = 0`. For each `price` in `prices`: update `minPrice = Math.min(minPrice, price)` and `maxProfit = Math.max(maxProfit, price - minPrice)`. Return `maxProfit` at the end for an O(n) time and O(1) auxiliary space solution.'
      }
    ]
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Determine if two strings are anagrams of each other by comparing their character frequencies.',
    description: `Given two strings \`s\` and \`t\`, return \`true\` *if \`t\` is an anagram of \`s\`, and \`false\` otherwise*.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      {
        input: 's = "anagram", t = "nagaram"',
        output: 'true',
        explanation: 'Both words contain three \'a\'s, one \'g\', one \'m\', one \'n\', and one \'r\'.'
      },
      {
        input: 's = "rat", t = "car"',
        output: 'false',
        explanation: 'Characters do not match in frequency.'
      }
    ],
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.'
    ],
    starterCode: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'First check lengths: if `s.length !== t.length`, can they ever be anagrams? If lengths are equal, what must be true about the count of each letter?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'You can use a character frequency table (either a 26-element array or a hash map). Increment count for characters in `s` and decrement for characters in `t`.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Check `if (s.length !== t.length) return false`. Create an array of size 26 filled with 0. Loop `i` from 0 to `s.length - 1`: increment index `s.charCodeAt(i) - 97` and decrement index `t.charCodeAt(i) - 97`. Finally verify all 26 buckets are zero. Runs in O(n) time and O(1) space.'
      }
    ]
  },
  {
    id: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Strings',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(m, n))',
    summary: 'Find the length of the longest contiguous substring that contains no duplicate characters.',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

A **substring** is a contiguous non-empty sequence of characters within a string.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Note that the answer must be a substring, "pwke" is a subsequence.'
      }
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Notice this asks for a contiguous window of unique elements. Think about the Sliding Window technique with two pointers `left` and `right`.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Expand `right` across the string. Keep a Map storing the last seen index of each character. When you encounter a character already seen inside the current window, contract or jump `left`.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Let `left = 0`, `maxLength = 0`, and `charMap = new Map()`. For `right = 0` to `s.length - 1`: if `charMap.has(s[right])` and `charMap.get(s[right]) >= left`, advance `left = charMap.get(s[right]) + 1`. Record `charMap.set(s[right], right)` and update `maxLength = Math.max(maxLength, right - left + 1)`. Returns in O(n) time and O(min(m, n)) space.'
      }
    ]
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    summary: 'Search for a target value in a sorted array in logarithmic O(log n) runtime.',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4.'
      },
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All the integers in nums are unique.',
      'nums is sorted in ascending order.'
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Because the array is already sorted, comparing the target against the middle element immediately halves your remaining search space.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use two pointers `low = 0` and `high = nums.length - 1`. While `low <= high`, calculate `mid = Math.floor((low + high) / 2)` and adjust boundaries accordingly.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'In the loop: If `nums[mid] === target`, return `mid`. If `nums[mid] < target`, discard left half by setting `low = mid + 1`. If `nums[mid] > target`, discard right half by setting `high = mid - 1`. If the loop finishes without finding target, return `-1`. Complexity is O(log n) time and O(1) space.'
      }
    ]
  },
  {
    id: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    estimatedTime: '30 mins',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    summary: 'Search for a target value in an ascending sorted array that has been rotated at an unknown pivot.',
    description: `There is an integer array \`nums\` sorted in ascending order (with **distinct** values).

Prior to being passed to your function, \`nums\` is **possibly rotated** at an unknown pivot index \`k\` (\`1 <= k < nums.length\`) such that the resulting array is \`[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]\` (0-indexed).

For example, \`[0,1,2,4,5,6,7]\` might be rotated at pivot index \`3\` and become \`[4,5,6,7,0,1,2]\`.

Given the array \`nums\` after the possible rotation and an integer \`target\`, return *the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`*.

You must achieve an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      {
        input: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 0',
        output: '4',
        explanation: '0 is located at index 4.'
      },
      {
        input: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 3',
        output: '-1',
        explanation: '3 does not exist in nums.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 5000',
      '-10^4 <= nums[i] <= 10^4',
      'All values of nums are unique.',
      'nums is an ascending array that is possibly rotated.',
      '-10^4 <= target <= 10^4'
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Even though the array is rotated, if you divide it at any index `mid`, at least one of the two halves (left or right) is guaranteed to remain strictly sorted.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Check whether the left half `nums[low] <= nums[mid]` is sorted. If it is, you can check whether `target` falls cleanly within `[nums[low], nums[mid])`. Otherwise, the right half must be sorted, so check `(nums[mid], nums[high]]`.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'While `low <= high`: compute `mid`. If `nums[mid] === target`, return `mid`. If `nums[low] <= nums[mid]` (left is sorted): if `target >= nums[low] && target < nums[mid]`, set `high = mid - 1`; else set `low = mid + 1`. Else (right is sorted): if `target > nums[mid] && target <= nums[high]`, set `low = mid + 1`; else set `high = mid - 1`. Return `-1` if not found. Complexity: O(log n).'
      }
    ]
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Reverse a singly linked list and return the new head of the reversed list.',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.

A linked list node is represented as:
\`\`\`js
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}
\`\`\``,
    examples: [
      {
        input: 'head = [1, 2, 3, 4, 5]',
        output: '[5, 4, 3, 2, 1]',
        explanation: 'Each pointer is redirected backwards.'
      },
      {
        input: 'head = [1, 2]',
        output: '[2, 1]',
        explanation: '2 points to 1, and 1 points to null.'
      },
      {
        input: 'head = []',
        output: '[]',
        explanation: 'Empty list remains empty.'
      }
    ],
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000'
    ],
    starterCode: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'To reverse a list in-place, each node\'s `next` pointer needs to point to its predecessor instead of its successor. What do you need to avoid losing access to the rest of the list?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Maintain three iterative pointers: `prev` (initially `null`), `curr` (initially `head`), and a temporary variable `nextTemp` to store `curr.next` before overwriting it.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'While `curr !== null`: save `nextTemp = curr.next`, redirect `curr.next = prev`, shift `prev = curr`, and advance `curr = nextTemp`. When the loop finishes, `prev` will point to the new head of the reversed list. Return `prev`. Runs in O(n) time and O(1) space.'
      }
    ]
  },
  {
    id: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    timeComplexity: 'O(n + m)',
    spaceComplexity: 'O(1)',
    summary: 'Splice together nodes of two sorted linked lists into a single sorted list.',
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.

Return *the head of the merged linked list*.`,
    examples: [
      {
        input: 'list1 = [1, 2, 4], list2 = [1, 3, 4]',
        output: '[1, 1, 2, 3, 4, 4]',
        explanation: 'Values are combined in non-decreasing order.'
      },
      {
        input: 'list1 = [], list2 = []',
        output: '[]',
        explanation: 'Merging two empty lists results in an empty list.'
      }
    ],
    constraints: [
      'The number of nodes in both lists is in the range [0, 50].',
      '-100 <= Node.val <= 100',
      'Both list1 and list2 are sorted in non-decreasing order.'
    ],
    starterCode: `/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoLists(list1, list2) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'A dummy head node simplifies edge cases so you don\'t need special conditional branches for choosing the very first node of the merged list.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Create `dummy = new ListNode(-1)` and a traversal pointer `tail = dummy`. Compare `list1.val` and `list2.val`. Attach the smaller node to `tail.next` and advance that list\'s pointer.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'While `list1 && list2`: if `list1.val <= list2.val`, `tail.next = list1; list1 = list1.next` else `tail.next = list2; list2 = list2.next`. Advance `tail = tail.next`. After the loop, attach remaining elements `tail.next = list1 || list2`. Return `dummy.next`. O(n + m) time, O(1) space.'
      }
    ]
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    topic: 'Stacks',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    summary: 'Validate whether brackets in a string are closed in the correct order using a stack.',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'Simple valid pair.'
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All brackets match type and order.'
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched closing bracket.'
      }
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.'
    ],
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Parentheses follow a Last-In, First-Out (LIFO) pattern. The most recently opened bracket must be the first one to be closed.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use an array as a Stack. When you see an opening bracket, push its expected closing bracket (or the bracket itself). When you encounter a closing bracket, pop from the stack and verify that it matches.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Map opening to closing: `{ \'(\': \')\', \'{\': \'}\', \'[\': \']\' }`. For each char `c`: if it\'s an opener, `stack.push(map[c])`. If it\'s a closer, `if (stack.pop() !== c) return false`. Finally return `stack.length === 0`. Complexity: O(n) time and O(n) space.'
      }
    ]
  },
  {
    id: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    summary: 'Find the maximum depth (longest path from root to a leaf node) in a binary tree.',
    description: `Given the \`root\` of a binary tree, return *its maximum depth*.

A binary tree\'s **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.

A binary tree node is represented as:
\`\`\`js
function TreeNode(val, left, right) {
  this.val = (val === undefined ? 0 : val);
  this.left = (left === undefined ? null : left);
  this.right = (right === undefined ? null : right);
}
\`\`\``,
    examples: [
      {
        input: 'root = [3, 9, 20, null, null, 15, 7]',
        output: '3',
        explanation: 'Path 3 -> 20 -> 15 has length 3.'
      },
      {
        input: 'root = [1, null, 2]',
        output: '2',
        explanation: 'Path 1 -> 2 has length 2.'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 10^4].',
      '-100 <= Node.val <= 100'
    ],
    starterCode: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
function maxDepth(root) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'The depth of a tree is 1 (for the root node itself) plus the greater of the depths of its left and right subtrees. This natural recursive relationship suggests Depth-First Search.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Define the base case: what is the depth of an empty tree (`root === null`)? For any other node, recursively call `maxDepth(root.left)` and `maxDepth(root.right)`.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Base case: `if (!root) return 0;`. Recursive step: `return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));`. Each node is visited once, yielding O(n) runtime and O(h) recursion stack space (where h is tree height).'
      }
    ]
  },
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    topic: 'Arrays',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    summary: 'Determine whether an array of integers contains any duplicate elements.',
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.`,
    examples: [
      {
        input: 'nums = [1, 2, 3, 1]',
        output: 'true',
        explanation: '1 appears at indices 0 and 3.'
      },
      {
        input: 'nums = [1, 2, 3, 4]',
        output: 'false',
        explanation: 'All elements are distinct.'
      },
      {
        input: 'nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]',
        output: 'true',
        explanation: 'Multiple elements appear more than once.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function containsDuplicate(nums) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'A brute force comparison compares all pairs in O(n²) time. Can you record seen elements in a data structure with O(1) lookups?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use a Hash Set (in C++, \`unordered_set<int>\`). Iterate through \`nums\`. For each number, if it is already in the set, a duplicate is found.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Initialize \`unordered_set<int> seen\`. For each \`x\` in \`nums\`: if \`seen.count(x)\` return \`true\`; else \`seen.insert(x)\`. If loop terminates without duplicates, return \`false\`. Runs in O(n) time and O(n) auxiliary space.'
      }
    ]
  },
  {
    id: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    topic: 'Arrays',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1) auxiliary space',
    summary: 'Calculate the product of all elements in an array except the element at each index, without using division.',
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.

You must write an algorithm that runs in \`O(n)\` time and without using the division operation.`,
    examples: [
      {
        input: 'nums = [1, 2, 3, 4]',
        output: '[24, 12, 8, 6]',
        explanation: 'At index 0: 2*3*4 = 24. At index 1: 1*3*4 = 12. At index 2: 1*2*4 = 8. At index 3: 1*2*3 = 6.'
      },
      {
        input: 'nums = [-1, 1, 0, -3, 3]',
        output: '[0, 0, 9, 0, 0]',
        explanation: 'Zero at index 2 makes all other products 0, while index 2 gets (-1)*1*(-3)*3 = 9.'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^5',
      '-30 <= nums[i] <= 30',
      'The product of any prefix or suffix fits in a 32-bit integer.'
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function productExceptSelf(nums) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Think of the product of all numbers except \`nums[i]\` as two parts: (product of all numbers to the left of i) * (product of all numbers to the right of i).'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'First pass from left to right: store running prefix products in \`answer\`. Second pass from right to left: maintain a running suffix multiplier and multiply it into \`answer[i]\`.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Let \`n = nums.size()\`. Initialize \`answer(n, 1)\`. Loop \`i\` from 1 to n-1: \`answer[i] = answer[i-1] * nums[i-1]\`. Initialize \`suffix = 1\`. Loop \`i\` from n-1 down to 0: \`answer[i] *= suffix; suffix *= nums[i]\`. Return \`answer\`. O(n) runtime, O(1) auxiliary space.'
      }
    ]
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    topic: 'Strings',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Determine if a phrase is a palindrome considering only alphanumeric characters and ignoring cases.',
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` *if it is a palindrome, or \`false\` otherwise*.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.'
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.'
      },
      {
        input: 's = " "',
        output: 'true',
        explanation: 's is an empty string "" after removing non-alphanumeric characters, which reads the same backward and forward.'
      }
    ],
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.'
    ],
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'A two-pointer approach from both ends (left = 0, right = n-1) avoids creating an extra cleaned string in memory.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'While \`left < right\`: skip characters that are not alphanumeric using \`isalnum()\` in C++. Then compare \`tolower(s[left])\` against \`tolower(s[right])\`. If they differ, return false.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Let \`l = 0, r = s.size() - 1\`. While \`l < r\`: while \`l < r && !isalnum(s[l])\` l++; while \`l < r && !isalnum(s[r])\` r--; if \`tolower(s[l]) != tolower(s[r])\` return false; l++; r--;. Return true. Time: O(n), Space: O(1).'
      }
    ]
  },
  {
    id: 'find-minimum-in-rotated-sorted-array',
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    summary: 'Find the minimum element in an ascending sorted array that has been rotated at an unknown pivot.',
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times.

Given the sorted rotated array \`nums\` of **unique** elements, return *the minimum element of this array*.

You must write an algorithm that runs in \`O(log n)\` time.`,
    examples: [
      {
        input: 'nums = [3, 4, 5, 1, 2]',
        output: '1',
        explanation: 'The original array was [1, 2, 3, 4, 5] rotated 3 times.'
      },
      {
        input: 'nums = [4, 5, 6, 7, 0, 1, 2]',
        output: '0',
        explanation: 'The original array was [0, 1, 2, 4, 5, 6, 7] and it was rotated 4 times.'
      },
      {
        input: 'nums = [11, 13, 15, 17]',
        output: '11',
        explanation: 'The original array was [11, 13, 15, 17] and it was rotated 4 times.'
      }
    ],
    constraints: [
      'n == nums.length',
      '1 <= n <= 5000',
      '-5000 <= nums[i] <= 5000',
      'All the integers of nums are unique.',
      'nums is sorted and rotated between 1 and n times.'
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findMin(nums) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'The minimum element is the only element whose predecessor is larger than itself (the inflection point of rotation).'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Compare \`nums[mid]\` with \`nums[high]\`. If \`nums[mid] > nums[high]\`, the minimum MUST lie strictly in the right half (\`low = mid + 1\`). If \`nums[mid] <= nums[high]\`, the minimum lies in the left half or at \`mid\` itself (\`high = mid\`).'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Initialize \`low = 0, high = nums.size() - 1\`. While \`low < high\`: \`mid = low + (high - low) / 2\`. If \`nums[mid] > nums[high]\`, \`low = mid + 1\`; else \`high = mid\`. When \`low == high\`, return \`nums[low]\`. Complexity: O(log n) time and O(1) space.'
      }
    ]
  },
  {
    id: 'daily-temperatures',
    title: 'Daily Temperatures',
    topic: 'Stacks',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    summary: 'Find how many days you have to wait after each day to get a warmer temperature using a monotonic stack.',
    description: `Given an array of integers \`temperatures\` represents the daily temperatures, return *an array \`answer\` such that \`answer[i]\` is the number of days you have to wait after the \`i\`th day to get a warmer temperature*. If there is no future day for which this is possible, keep \`answer[i] == 0\` instead.`,
    examples: [
      {
        input: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]',
        output: '[1, 1, 4, 2, 1, 1, 0, 0]',
        explanation: 'At index 0, warmer day is tomorrow (day 1, wait 1). At index 2 (75), next warmer day is day 6 (76, wait 4).'
      },
      {
        input: 'temperatures = [30, 40, 50, 60]',
        output: '[1, 1, 1, 0]',
        explanation: 'Each day is warmer than the previous day except the last.'
      },
      {
        input: 'temperatures = [30, 60, 90]',
        output: '[1, 1, 0]',
        explanation: 'Monotonic rise until maximum.'
      }
    ],
    constraints: [
      '1 <= temperatures.length <= 10^5',
      '30 <= temperatures[i] <= 100'
    ],
    starterCode: `/**
 * @param {number[]} temperatures
 * @return {number[]}
 */
function dailyTemperatures(temperatures) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'You need the next greater element for each index. A monotonic decreasing stack stores indices of days whose warmer day has not yet been found.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Iterate \`i\` through temperatures. While the stack is not empty and \`temperatures[i] > temperatures[stack.top()]\`, pop index \`prevIdx = stack.top()\` and record \`answer[prevIdx] = i - prevIdx\`. Then push \`i\`.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Initialize \`answer(n, 0)\` and \`stack<int> st\`. For \`i\` from 0 to n-1: while \`!st.empty() && temperatures[i] > temperatures[st.top()]\`: \`int prev = st.top(); st.pop(); answer[prev] = i - prev;\`. Push \`i\`. Return \`answer\`. Each index is pushed and popped at most once, yielding O(n) runtime and O(n) space.'
      }
    ]
  },
  {
    id: 'evaluate-reverse-polish-notation',
    title: 'Evaluate Reverse Polish Notation',
    topic: 'Stacks',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    summary: 'Evaluate the value of an arithmetic expression in Reverse Polish Notation (postfix) using a stack.',
    description: `You are given an array of strings \`tokens\` that represents an arithmetic expression in **Reverse Polish Notation** (postfix notation).

Evaluate the expression. Return *an integer that represents the value of the expression*.

**Note that:**
* The valid operators are \`'+'\`, \`'-'\`, \`'*'\`, and \`'/'\`.
* Each operand may be an integer or another expression.
* The division between two integers always **truncates toward zero**.
* There will not be any division by zero.
* The input represents a valid arithmetic expression in reverse polish notation.`,
    examples: [
      {
        input: 'tokens = ["2", "1", "+", "3", "*"]',
        output: '9',
        explanation: '((2 + 1) * 3) = 9'
      },
      {
        input: 'tokens = ["4", "13", "5", "/", "+"]',
        output: '6',
        explanation: '(4 + (13 / 5)) = 6'
      },
      {
        input: 'tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]',
        output: '22',
        explanation: 'Evaluates to 22.'
      }
    ],
    constraints: [
      '1 <= tokens.length <= 10^4',
      'tokens[i] is either an operator: "+", "-", "*", or "/", or an integer in the range [-200, 200].'
    ],
    starterCode: `/**
 * @param {string[]} tokens
 * @return {number}
 */
function evalRPN(tokens) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'In postfix notation, an operator applies to the two most recently evaluated operands. This LIFO property matches a Stack.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Iterate through tokens. If token is a number, push it onto the stack. If token is an operator, pop the top two numbers (note that the first popped is the RIGHT operand \`b\` and the second popped is the LEFT operand \`a\`), apply the operator, and push the result.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Use \`stack<long long> st\`. For each token: if operator (\`+\`, \`-\`, \`*\`, \`/\`), pop \`b\`, pop \`a\`, compute \`a + b\`, \`a - b\`, \`a * b\`, or \`a / b\`, push result. Else, push \`stoll(token)\`. At the end, return \`st.top()\`. O(n) runtime, O(n) auxiliary space.'
      }
    ]
  },
  {
    id: 'linked-list-cycle',
    title: 'Linked List Cycle',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Determine if a linked list contains a cycle using fast and slow pointers (Floyd\'s algorithm).',
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer.

Return \`true\` *if there is a cycle in the linked list*. Otherwise, return \`false\`.`,
    examples: [
      {
        input: 'head = [3, 2, 0, -4], pos = 1',
        output: 'true',
        explanation: 'There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).'
      },
      {
        input: 'head = [1, 2], pos = 0',
        output: 'true',
        explanation: 'There is a cycle in the linked list, where the tail connects to the 0th node.'
      },
      {
        input: 'head = [1], pos = -1',
        output: 'false',
        explanation: 'There is no cycle in the linked list.'
      }
    ],
    constraints: [
      'The number of the nodes in the list is in the range [0, 10^4].',
      '-10^5 <= Node.val <= 10^5',
      'pos is -1 or a valid index in the linked-list.'
    ],
    starterCode: `/**
 * @param {ListNode} head
 * @return {boolean}
 */
function hasCycle(head) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Imagine two runners on a circular track: if one runs at twice the speed of the other, will the faster runner eventually lap the slower runner?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use Floyd\'s Cycle-Finding Algorithm (Tortoise and Hare). Maintain two pointers: \`slow\` moves 1 step at a time, \`fast\` moves 2 steps at a time. If there is a cycle, they will eventually meet.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'If \`!head || !head->next\` return false. Initialize \`slow = head, fast = head\`. While \`fast && fast->next\`: \`slow = slow->next; fast = fast->next->next;\`. If \`slow == fast\` return true. If loop exits, return false. Runtime: O(n), Space: O(1).'
      }
    ]
  },
  {
    id: 'middle-of-the-linked-list',
    title: 'Middle of the Linked List',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Find the middle node of a singly linked list using the two-pointer runner technique.',
    description: `Given the \`head\` of a singly linked list, return *the middle node of the linked list*.

If there are two middle nodes, return **the second middle** node.`,
    examples: [
      {
        input: 'head = [1, 2, 3, 4, 5]',
        output: '[3, 4, 5]',
        explanation: 'The middle node of the list is node 3.'
      },
      {
        input: 'head = [1, 2, 3, 4, 5, 6]',
        output: '[4, 5, 6]',
        explanation: 'Since the list has two middle nodes with values 3 and 4, we return the second one (node 4).'
      }
    ],
    constraints: [
      'The number of nodes in the list is in the range [1, 100].',
      '1 <= Node.val <= 100'
    ],
    starterCode: `/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function middleNode(head) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Instead of counting nodes in a first pass and traversing half-way in a second pass, can you find the middle in a single pass with two pointers moving at different speeds?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Advance \`slow\` by 1 node and \`fast\` by 2 nodes on each step. When \`fast\` reaches the end of the list, \`slow\` will be exactly at the middle.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'Initialize \`slow = head, fast = head\`. While \`fast != nullptr && fast->next != nullptr\`: \`slow = slow->next; fast = fast->next->next;\`. Return \`slow\`. Runs in a single pass O(n) time and O(1) auxiliary space.'
      }
    ]
  },
  {
    id: 'same-tree',
    title: 'Same Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    summary: 'Check if two binary trees are structurally identical and have the same node values.',
    description: `Given the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.

Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.`,
    examples: [
      {
        input: 'p = [1, 2, 3], q = [1, 2, 3]',
        output: 'true',
        explanation: 'Both trees have identical values and topology.'
      },
      {
        input: 'p = [1, 2], q = [1, null, 2]',
        output: 'false',
        explanation: 'Trees have different structure.'
      },
      {
        input: 'p = [1, 2, 1], q = [1, 1, 2]',
        output: 'false',
        explanation: 'Values differ at right child of root.'
      }
    ],
    constraints: [
      'The number of nodes in both trees is in the range [0, 100].',
      '-10^4 <= Node.val <= 10^4'
    ],
    starterCode: `/**
 * @param {TreeNode} p
 * @param {TreeNode} q
 * @return {boolean}
 */
function isSameTree(p, q) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Two trees are the same if their current roots have the same value, AND their left subtrees are identical, AND their right subtrees are identical.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use recursion. Base cases: If both \`p\` and \`q\` are null, return true. If exactly one is null or \`p->val != q->val\`, return false.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'If \`!p && !q\` return true. If \`!p || !q || p->val != q->val\` return false. Return \`isSameTree(p->left, q->left) && isSameTree(p->right, q->right)\`. Time: O(n), Space: O(h).'
      }
    ]
  },
  {
    id: 'invert-binary-tree',
    title: 'Invert Binary Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    summary: 'Invert a binary tree by swapping the left and right children of every node recursively.',
    description: `Given the \`root\` of a binary tree, invert the tree, and return *its root*.`,
    examples: [
      {
        input: 'root = [4, 2, 7, 1, 3, 6, 9]',
        output: '[4, 7, 2, 9, 6, 3, 1]',
        explanation: 'Every left child swapped with right child.'
      },
      {
        input: 'root = [2, 1, 3]',
        output: '[2, 3, 1]',
        explanation: 'Subtrees are mirrored.'
      },
      {
        input: 'root = []',
        output: '[]',
        explanation: 'Empty tree inverts to empty tree.'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 100].',
      '-100 <= Node.val <= 100'
    ],
    starterCode: `/**
 * @param {TreeNode} root
 * @return {TreeNode}
 */
function invertTree(root) {
  // Write your solution here
  
}
`,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Inverting a binary tree means for every node in the tree, you swap its left and right child pointers.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Base case: If \`root == null\`, return \`null\`. Otherwise, swap \`root->left\` and \`root->right\`, and recursively call \`invertTree\` on both children.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'If \`!root\` return nullptr. \`swap(root->left, root->right)\`. Recursively call \`invertTree(root->left)\` and \`invertTree(root->right)\`. Return \`root\`. Time: O(n), Space: O(h).'
      }
    ]
  }
];

export const TOPICS = ['All', 'Arrays', 'Strings', 'Binary Search', 'Linked Lists', 'Stacks', 'Trees'];
export const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
