/**
 * server/coachService.js
 *
 * SERVER-SIDE ONLY — Context-Aware AI Learning Coach.
 *
 * Responsibilities:
 *  - Enforce Blind Solve mode privacy & restrictions (refuse hints if blind solve is active).
 *  - Strictly protect hidden tests: never accept or forward hidden test cases to external LLMs.
 *  - Provide three explicit actions:
 *      1. 'explain' — Root-cause explanation of mistake or code guidance
 *      2. 'hint'    — Progressive hinting (Level 1 Nudge -> Level 2 Approach -> Level 3 Blueprint)
 *      3. 'test'    — Targeted understanding check or small tracing exercise
 *  - Integrate with external AI provider if configured (GEMINI_API_KEY or OPENAI_API_KEY)
 *    using Node's native fetch (zero paid/extra dependencies).
 *  - Fall back seamlessly to high-quality deterministic guidance if no provider is configured,
 *    or if the network/API request fails.
 */

'use strict';

// ─── Problem-Specific Hints & Understanding Checks (Deterministic Fallback) ───
const PROBLEM_KNOWLEDGE = {
  'two-sum': {
    title: 'Two Sum',
    topic: 'Arrays',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'A brute-force solution checks every pair with two nested loops in O(n²) time. Can you store numbers you have already visited so you can find their complement in O(1) time?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use an std::unordered_map<int, int> in C++. As you iterate through the array, the complement needed for the current element `x` is `target - x`. Check if this complement already exists in your map.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: '1. Create `unordered_map<int, int> seen`. 2. Loop `i` from 0 to n-1. 3. Calculate `int complement = target - nums[i]`. 4. If `seen.count(complement)`, return `{seen[complement], i}`. 5. Otherwise, store `seen[nums[i]] = i`. Guarantees O(n) time and O(n) auxiliary space.'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given nums = [3, 2, 4] and target = 6, when the loop inspects index 1 (value 2), what complement value does the hash map look for?',
        options: [
          '4 (because 6 - 2 = 4)',
          '3 (because 6 - 3 = 3)',
          '2 (because the current element is 2)',
          '6 (the target value itself)'
        ],
        correctIndex: 0,
        explanation: 'Correct! The complement is target - nums[i] = 6 - 2 = 4. Since 4 is not yet in the map, 2 is inserted with index 1.'
      },
      {
        question: 'Why must we check for the complement in our map BEFORE inserting the current number into the map?',
        options: [
          'To prevent using the same element twice (e.g. target = 6 and nums[i] = 3 matching with itself)',
          'Because C++ unordered_map does not allow duplicate keys',
          'To avoid a compilation error with std::vector',
          'It makes no difference whether we insert before or after'
        ],
        correctIndex: 0,
        explanation: 'Spot on! If you insert first, a number like 3 when target is 6 would immediately match with itself, violating the rule that each element can only be used once.'
      }
    ]
  },
  'best-time-to-buy-and-sell-stock': {
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'You can only sell stock after you have bought it. As you scan through days from left to right, what is the lowest purchase price observed so far?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Maintain two dynamic tracking variables during a single linear traversal: `minPrice` (the lowest price seen up to today) and `maxProfit` (the greatest difference between today\'s price and `minPrice`).'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: '1. Initialize `int minPrice = INT_MAX` and `int maxProfit = 0`. 2. For each `price` in `prices`: update `minPrice = min(minPrice, price)` and `maxProfit = max(maxProfit, price - minPrice)`. 3. Return `maxProfit`. Achieves O(n) runtime and O(1) space.'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given prices = [7, 1, 5, 3], what are minPrice and maxProfit after processing day 3 (price = 5)?',
        options: [
          'minPrice = 1, maxProfit = 4',
          'minPrice = 7, maxProfit = 5',
          'minPrice = 1, maxProfit = 5',
          'minPrice = 5, maxProfit = 2'
        ],
        correctIndex: 0,
        explanation: 'Correct! Day 1 price was 7, day 2 dropped minPrice to 1. On day 3 (price 5), profit is 5 - 1 = 4, so maxProfit becomes 4.'
      },
      {
        question: 'What should the function return if prices are strictly decreasing, such as [7, 6, 4, 3, 1]?',
        options: [
          '0 (no profitable transaction is possible)',
          '-1 (representing a net loss)',
          '1 (the lowest price in the array)',
          'INT_MIN'
        ],
        correctIndex: 0,
        explanation: 'Correct! If no profit can be achieved, the problem requires returning 0, not a negative number.'
      }
    ]
  },
  'valid-anagram': {
    title: 'Valid Anagram',
    topic: 'Strings',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Two strings are anagrams if and only if they have the exact same characters with the exact same frequencies. What is the immediate check if their lengths differ?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'If s.length() != t.length(), return false immediately. Since characters are lowercase English letters (\'a\' through \'z\'), you can use an integer array `int count[26] = {0}` or a hash map.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: '1. If `s.length() != t.length()`, return `false`. 2. Create `vector<int> count(26, 0)`. 3. Loop `i` from 0 to length-1: `count[s[i] - \'a\']++` and `count[t[i] - \'a\']--`. 4. Verify all entries in `count` are 0. Runtime: O(n), Space: O(1).'
      }
    ],
    checks: [
      {
        question: 'Why is verifying that sum(ASCII values of s) == sum(ASCII values of t) insufficient to determine if two strings are anagrams?',
        options: [
          'Different character combinations can produce identical sums (e.g. "ad" has ASCII sum 97+100=197, while "bc" has 98+99=197)',
          'C++ cannot sum ASCII char values',
          'String length check always prevents anagrams with equal ASCII sums',
          'ASCII values in C++ are unsigned and cause integer overflow'
        ],
        correctIndex: 0,
        explanation: 'Exactly! ASCII sum is a hash with high collision rates. Distinct strings like "ad" and "bc" have identical sums but are not anagrams.'
      },
      {
        question: 'What is the space complexity of using a fixed array of size 26 for English lowercase anagram checking?',
        options: [
          'O(1) constant auxiliary space (the table size 26 is fixed regardless of input string length)',
          'O(n) linear space',
          'O(26^n) exponential space',
          'O(log n) logarithmic space'
        ],
        correctIndex: 0,
        explanation: 'Correct! Because the alphabet size (26) does not scale with the length of the string, the extra memory used is O(1).'
      }
    ]
  },
  'contains-duplicate': {
    title: 'Contains Duplicate',
    topic: 'Arrays',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Comparing every element to every other element requires O(n²) time. Can you record seen items in a set to achieve O(1) average lookup time?'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Use an unordered_set<int> in C++. As you iterate through the array, check if the current number is already in the set. If so, return true. Otherwise insert it.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: '1. Create unordered_set<int> seen. 2. For each num in nums: if (seen.count(num)) return true; else seen.insert(num); 3. Return false if the loop finishes. Time: O(n), Space: O(n).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given nums = [1, 2, 3, 1], what is the size of the hash set immediately before the duplicate is detected at index 3?',
        options: [
          '3 (containing elements 1, 2, and 3)',
          '4 (all elements)',
          '1 (only element 1)',
          '0 (the set is still empty)'
        ],
        correctIndex: 0,
        explanation: 'Correct! Indices 0, 1, and 2 inserted values 1, 2, and 3 into the set. At index 3, value 1 is already in the set of size 3.'
      },
      {
        question: 'If you sorted the array first instead of using a hash set, what would be the trade-off in time and auxiliary space?',
        options: [
          'Time increases to O(n log n), but auxiliary space drops to O(1) if sorting in-place',
          'Time drops to O(1), but space increases to O(n²)',
          'Sorting does not help detect adjacent duplicates',
          'Sorting requires O(n²) space in C++'
        ],
        correctIndex: 0,
        explanation: 'Spot on! Sorting groups identical elements adjacent to each other, allowing an O(1) space scan at the cost of O(n log n) comparison time.'
      }
    ]
  },
  'product-of-array-except-self': {
    title: 'Product of Array Except Self',
    topic: 'Arrays',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'The product of all elements except nums[i] is equivalent to (prefix product of elements to left of i) * (suffix product of elements to right of i).'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'First pass left-to-right: answer[i] stores the product of all elements before i. Second pass right-to-left: multiply answer[i] by a running suffix product variable.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: '1. vector<int> ans(n, 1). 2. For i from 1 to n-1: ans[i] = ans[i-1] * nums[i-1]. 3. int suffix = 1. 4. For i from n-1 down to 0: ans[i] *= suffix; suffix *= nums[i]. 5. Return ans. Time: O(n), Auxiliary Space: O(1).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given nums = [1, 2, 3, 4], what is the value of answer[2] after the prefix pass (step 2) and before the suffix pass?',
        options: [
          '2 (since 1 * 2 = 2)',
          '6 (since 1 * 2 * 3 = 6)',
          '8 (the final answer)',
          '1 (the initial value)'
        ],
        correctIndex: 0,
        explanation: 'Correct! The prefix product strictly to the left of index 2 is nums[0] * nums[1] = 1 * 2 = 2.'
      },
      {
        question: 'Why is using division (total product / nums[i]) discouraged or problematic in this problem?',
        options: [
          'Division fails when array contains one or more zeros (division by zero error)',
          'C++ does not support integer division',
          'Division takes O(n) time per element',
          'Division cannot produce negative numbers'
        ],
        correctIndex: 0,
        explanation: 'Exactly! When nums contains a zero, total product becomes 0 and dividing by 0 causes a runtime crash. Multiple zeros make all results 0.'
      }
    ]
  },
  'valid-palindrome': {
    title: 'Valid Palindrome',
    topic: 'Strings',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Two pointers starting at both ends of the string can compare corresponding characters without copying or allocating an extra filtered string.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'While left < right, skip non-alphanumeric characters using isalnum(). Compare tolower(s[left]) and tolower(s[right]). If they differ, return false.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'int l = 0, r = s.size() - 1; while (l < r) { while (l < r && !isalnum(s[l])) l++; while (l < r && !isalnum(s[r])) r--; if (tolower(s[l]) != tolower(s[r])) return false; l++; r--; } return true; Time: O(n), Space: O(1).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: How does the two-pointer approach evaluate the string "0P"?',
        options: [
          'false (both \'0\' and \'P\' are alphanumeric, and \'0\' != \'p\')',
          'true (because numbers are ignored)',
          'true (because the string is too short)',
          'Compilation error'
        ],
        correctIndex: 0,
        explanation: 'Correct! Both \'0\' and \'P\' are alphanumeric characters. Since \'0\' != \'p\', it correctly returns false.'
      }
    ]
  },
  'find-minimum-in-rotated-sorted-array': {
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'Binary Search',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'In a rotated sorted array with unique elements, the minimum element is located at the rotation inflection point.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Compare nums[mid] with nums[high]. If nums[mid] > nums[high], the inflection point must be to the right of mid (low = mid + 1). If nums[mid] <= nums[high], the minimum is at mid or to the left (high = mid).'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'int low = 0, high = nums.size() - 1; while (low < high) { int mid = low + (high - low) / 2; if (nums[mid] > nums[high]) low = mid + 1; else high = mid; } return nums[low]; Time: O(log n), Space: O(1).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given nums = [4, 5, 6, 7, 0, 1, 2], with low = 0 and high = 6 (mid = 3, nums[mid] = 7), what is the next interval?',
        options: [
          'low = 4, high = 6 (because nums[3] = 7 > nums[6] = 2)',
          'low = 0, high = 3 (search left)',
          'low = 3, high = 6',
          'low = 0, high = 6'
        ],
        correctIndex: 0,
        explanation: 'Correct! Since nums[mid] (7) > nums[high] (2), the smaller elements and the pivot must lie strictly in the right half.'
      }
    ]
  },
  'daily-temperatures': {
    title: 'Daily Temperatures',
    topic: 'Stacks',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'You need the distance to the next greater element for each index. A monotonic decreasing stack stores indices waiting for a warmer temperature.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Iterate i through temperatures. While stack is not empty and temperatures[i] > temperatures[stack.top()], pop the previous index and record answer[prev] = i - prev. Then push i.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'vector<int> ans(n, 0); stack<int> st; for (int i = 0; i < n; ++i) { while (!st.empty() && temperatures[i] > temperatures[st.top()]) { int prev = st.top(); st.pop(); ans[prev] = i - prev; } st.push(i); } return ans; Time: O(n), Space: O(n).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given temperatures = [30, 40, 50], after processing day 1 (temp 40), what is recorded in answer[0]?',
        options: [
          '1 (because day 1 is 1 day after day 0 and 40 > 30)',
          '0 (unresolved)',
          '10 (temperature difference)',
          '2 (days remaining)'
        ],
        correctIndex: 0,
        explanation: 'Correct! When day 1 (40) is processed, 40 > 30 so index 0 is popped and answer[0] = 1 - 0 = 1.'
      }
    ]
  },
  'evaluate-reverse-polish-notation': {
    title: 'Evaluate Reverse Polish Notation',
    topic: 'Stacks',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'In postfix notation, every operator applies to the two most recently calculated numbers. A stack directly simulates this LIFO evaluation.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'If token is a number, push it. If token is an operator, pop the right operand b, then the left operand a. Compute a OP b and push the result.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'stack<long long> st; for (auto& t : tokens) { if (isOp(t)) { long long b = st.top(); st.pop(); long long a = st.top(); st.pop(); st.push(applyOp(a, b, t)); } else { st.push(stoll(t)); } } return st.top(); Time: O(n), Space: O(n).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given tokens = ["4", "13", "5", "/", "+"], what is the result of (13 / 5) using integer truncation toward zero?',
        options: [
          '2 (13 / 5 = 2.6, truncated toward zero is 2)',
          '3 (rounded up)',
          '2.6 (floating point)',
          '0'
        ],
        correctIndex: 0,
        explanation: 'Correct! In integer arithmetic, 13 / 5 truncates to 2. Then 4 + 2 yields 6.'
      }
    ]
  },
  'linked-list-cycle': {
    title: 'Linked List Cycle',
    topic: 'Linked Lists',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'If a list has a cycle, traversing with two pointers at different speeds (1 step vs 2 steps) will cause the fast pointer to catch up with the slow pointer.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Initialize slow = head, fast = head. While fast && fast->next, advance slow by 1 and fast by 2. If slow == fast, a cycle exists.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'ListNode *slow = head, *fast = head; while (fast && fast->next) { slow = slow->next; fast = fast->next->next; if (slow == fast) return true; } return false; Time: O(n), Space: O(1).'
      }
    ],
    checks: [
      {
        question: 'Why does Floyd\'s Tortoise and Hare algorithm use O(1) memory compared to a hash table approach?',
        options: [
          'It only tracks two pointers instead of storing addresses of every visited node in a set',
          'It modifies the list values directly',
          'It deletes the cycle nodes',
          'It runs in exponential time'
        ],
        correctIndex: 0,
        explanation: 'Correct! A hash table requires O(n) memory to store pointer addresses, whereas two pointers only use two pointer variables O(1).'
      }
    ]
  },
  'middle-of-the-linked-list': {
    title: 'Middle of the Linked List',
    topic: 'Linked Lists',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'When a fast runner covers twice the distance of a slow runner, by the time the fast runner finishes, the slow runner is at the exact halfway mark.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Initialize slow = head, fast = head. While fast != nullptr && fast->next != nullptr: slow = slow->next; fast = fast->next->next. Return slow.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'ListNode *slow = head, *fast = head; while (fast && fast->next) { slow = slow->next; fast = fast->next->next; } return slow; Time: O(n), Space: O(1).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given head = [1, 2, 3, 4], where does slow land when fast runs out of bounds (fast reaches null)?',
        options: [
          'Node 3 (the second middle node, as required for even lengths)',
          'Node 2 (the first middle node)',
          'Node 1 (the head)',
          'Node 4 (the tail)'
        ],
        correctIndex: 0,
        explanation: 'Correct! Initially slow=1, fast=1. Step 1: slow=2, fast=3. Step 2: slow=3, fast=null. Loop terminates with slow pointing to node 3.'
      }
    ]
  },
  'same-tree': {
    title: 'Same Tree',
    topic: 'Trees',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Two trees are identical if their current root values match AND their respective left and right subtrees are identical.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'Base cases: If both p and q are null, return true. If exactly one is null or p->val != q->val, return false. Otherwise recursively check left and right.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'if (!p && !q) return true; if (!p || !q || p->val != q->val) return false; return isSameTree(p->left, q->left) && isSameTree(p->right, q->right); Time: O(n), Space: O(h).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given p = [1, 2] and q = [1, null, 2], why is isSameTree false?',
        options: [
          'In p, 2 is the left child of 1, but in q, 2 is the right child of 1 (structural mismatch)',
          'Because the root values differ',
          'Because neither tree has a root node',
          'Because both trees have 2 nodes'
        ],
        correctIndex: 0,
        explanation: 'Correct! When comparing p->left (node 2) with q->left (null), one is null and the other is not, returning false.'
      }
    ]
  },
  'invert-binary-tree': {
    title: 'Invert Binary Tree',
    topic: 'Trees',
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: 'Inverting a tree means creating a mirror image by swapping every node\'s left and right children.'
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: 'If root is null, return null. Swap root->left and root->right. Recursively call invertTree on root->left and root->right.'
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: 'if (!root) return nullptr; swap(root->left, root->right); invertTree(root->left); invertTree(root->right); return root; Time: O(n), Space: O(h).'
      }
    ],
    checks: [
      {
        question: 'Tracing check: Given a tree with root 2, left child 1, right child 3, what are the left and right children after inversion?',
        options: [
          'Left child is 3, right child is 1',
          'Left child is 1, right child is 3',
          'Both children become null',
          'The tree is unchanged'
        ],
        correctIndex: 0,
        explanation: 'Correct! Swapping left (1) and right (3) results in left = 3 and right = 1.'
      }
    ]
  }
};

// ─── Generic Fallback for Other/Unregistered Problems ──────────────────────────
function getGenericProblemData(problemId, title, topic) {
  const t = topic || 'Algorithms';
  return {
    title: title || 'Problem',
    topic: t,
    hints: [
      {
        level: 1,
        title: 'Conceptual Nudge',
        content: `Consider the fundamental invariants in ${t}. Can you break down the problem into smaller subproblems or identify a data structure (hash map, two pointers, stack) that avoids redundant work?`
      },
      {
        level: 2,
        title: 'Specific Approach',
        content: `Identify the state that needs to be preserved as you process the inputs sequentially. Are you sorting, keeping track of visited elements, or maintaining a sliding window?`
      },
      {
        level: 3,
        title: 'Algorithmic Blueprint',
        content: `1. Handle base/edge cases (empty input, single element, boundary limits). 2. Iterate through input elements maintaining your data structure invariant. 3. Return the aggregated result. Aim for the optimal time complexity.`
      }
    ],
    checks: [
      {
        question: `In ${t} problems, which step should always be verified before writing your main logic loop?`,
        options: [
          'Checking boundary/base conditions (e.g., empty collection, single element, zero values)',
          'Always sorting the input array even when not needed',
          'Hardcoding test case answers',
          'Allocating maximum possible memory dynamically'
        ],
        correctIndex: 0,
        explanation: 'Correct! Guarding against boundary conditions early prevents segmentation faults and unexpected edge-case failures.'
      }
    ]
  };
}

// ─── Deterministic Coach Response Generator ──────────────────────────────────
function generateDeterministicResponse({ action, problemId, problemTitle, topic, userCode, submissionOutcome, hintLevel = 1, attemptHistory = [] }) {
  const probData = PROBLEM_KNOWLEDGE[problemId] || getGenericProblemData(problemId, problemTitle, topic);
  const diag = submissionOutcome?.diagnosis;
  const status = submissionOutcome?.status;

  // 1. EXPLAIN MY MISTAKE
  if (action === 'explain') {
    // If no code submitted or empty
    if (!userCode || !userCode.trim()) {
      return {
        title: 'No Solution Code Submitted Yet',
        category: 'EMPTY_SUBMISSION',
        explanation: `You haven't written or submitted any C++ code yet for "${probData.title}".`,
        details: 'To get started, review the starter code and problem description. When you are ready, click "Run & Submit C++ Code" to execute automated tests, or click "Give Me a Hint" for a conceptual nudge.',
        nextStep: 'Draft an initial approach in the editor. You can use the "Give Me a Hint" tab if you would like guidance on which data structure to choose.'
      };
    }

    // If accepted
    if (status === 'ACCEPTED') {
      return {
        title: 'All Test Cases Passed!',
        category: 'ACCEPTED',
        explanation: `Fantastic work! Your C++ solution for "${probData.title}" passed all automated test cases.`,
        details: 'To solidify your mastery, consider: 1) What are the exact time and auxiliary space complexities? 2) Could this be solved with fewer memory allocations? 3) Try solving this problem in Blind Solve Challenge Mode to test your speed and autonomy.',
        nextStep: 'Check the Roadmap or Dashboard to tackle your next recommended problem!'
      };
    }

    // If compilation error
    if (status === 'COMPILATION_ERROR' || diag?.category === 'COMPILATION_ERROR') {
      const gccErr = submissionOutcome?.compilerError || 'GCC compilation error';
      let syntaxNudge = 'Check for missing semicolons `;`, mismatched braces `{}`, or incorrect type declarations.';
      if (gccErr.includes('not declared in this scope')) {
        syntaxNudge = 'An identifier or variable name was used before being declared, or a required header (like <vector>, <string>, or <unordered_map>) is missing.';
      } else if (gccErr.includes('no matching function')) {
        syntaxNudge = 'A method or function was called with arguments that do not match its C++ signature. Check parameter types and count.';
      } else if (gccErr.includes('expected')) {
        syntaxNudge = 'A syntax token (such as a semicolon `;` or closing parenthesis `)`) is expected near the line reported by the compiler.';
      }

      return {
        title: 'Compilation & Syntax Error',
        category: 'COMPILATION_ERROR',
        explanation: 'GCC was unable to compile your C++ code. The compiler rejected the syntax before running any tests.',
        details: syntaxNudge,
        compilerSnippet: gccErr.length > 300 ? gccErr.slice(0, 300) + '...' : gccErr,
        nextStep: 'Review the line number mentioned in the compiler output below. Fix the syntax issue and click "Run & Submit C++ Code" again.'
      };
    }

    // If runtime error
    if (status === 'RUNTIME_ERROR' || diag?.category === 'RUNTIME_ERROR') {
      return {
        title: 'Runtime Crash Detected',
        category: 'RUNTIME_ERROR',
        explanation: 'Your code compiled successfully, but crashed during execution (e.g., Segmentation Fault or Abort).',
        details: 'In C++, runtime crashes are typically caused by: 1) Accessing vector or array indices out of bounds (e.g. `nums[i]` when `i >= nums.size()`), 2) Dereferencing null or uninitialized pointers, or 3) Division by zero. Try replacing `nums[i]` with `nums.at(i)` to check if an out-of-range exception is triggered.',
        nextStep: 'Add boundary checks before indexing into arrays or vectors (e.g., `if (i < nums.size())`).'
      };
    }

    // If TLE
    if (status === 'TIME_LIMIT_EXCEEDED' || diag?.category === 'TLE') {
      return {
        title: 'Time Limit Exceeded (High Complexity)',
        category: 'TLE',
        explanation: 'Your solution timed out before completing the test suite.',
        details: 'This usually indicates an algorithm with quadratic O(n²) or exponential time complexity when the input size demands an O(n) or O(n log n) approach. Nested loops scanning the same array repeatedly are the primary cause.',
        nextStep: 'Can you replace the inner loop by trading space for time? A hash map (`unordered_map`) or two-pointer technique can often reduce an O(n²) scan to O(n).'
      };
    }

    // If Edge-Case Failure
    if (diag?.category === 'EDGE_CASE_FAILURE') {
      return {
        title: 'Edge-Case Failure',
        category: 'EDGE_CASE_FAILURE',
        explanation: 'Your core algorithm works for standard inputs, but failed on edge cases.',
        details: 'Common DSA edge cases to check: 1) Duplicate numbers in the input, 2) Negative numbers or zeros, 3) Minimal inputs (array length 2 or single element), 4) Target sum constructed from identical values.',
        nextStep: 'Walk through your code line by line with an edge case (e.g., negative numbers or duplicate values) and observe how your variables update.'
      };
    }

    // If Boundary Error
    if (diag?.category === 'BOUNDARY_ERROR') {
      return {
        title: 'Boundary / Off-By-One Error',
        category: 'BOUNDARY_ERROR',
        explanation: 'Your outputs differ slightly from the expected result, likely due to an index boundary.',
        details: 'Look closely at your loop termination conditions (`i < n` vs `i <= n`), zero-based indexing, or whether you are returning 0-indexed vs 1-indexed values.',
        nextStep: 'Check whether your loop visits the first (index 0) and last (index n-1) elements properly.'
      };
    }

    // If Wrong Answer / Logic Error
    if (status === 'WRONG_ANSWER' || diag?.category === 'LOGIC_ERROR' || diag?.category === 'PARTIAL_LOGIC_ERROR') {
      return {
        title: diag?.label || 'Logical Misconception',
        category: diag?.category || 'LOGIC_ERROR',
        explanation: diag?.explanation || 'The output returned by your code does not match the expected answer on one or more test cases.',
        details: `For "${probData.title}", ensure your approach satisfies the problem constraints. Check whether your algorithm assumes sorted input, or whether elements can be reused.`,
        nextStep: diag?.nextStep || 'Inspect the failed test cases in the results panel. Trace through the first failing input manually on scratch paper.'
      };
    }

    // Default / No run yet
    return {
      title: 'Ready for Code Analysis',
      category: 'UNKNOWN',
      explanation: 'You haven\'t executed tests on this code yet, or test results are pending.',
      details: 'Run your code using the "Run & Submit C++ Code" button to see automated grading and targeted mistake diagnosis.',
      nextStep: 'Run your code, or click "Give Me a Hint" if you want guidance before submitting.'
    };
  }

  // 2. GIVE ME A HINT (Progressive)
  if (action === 'hint') {
    const safeLevel = Math.max(1, Math.min(3, Number(hintLevel) || 1));
    const hintObj = probData.hints.find(h => h.level === safeLevel) || probData.hints[0];

    return {
      level: safeLevel,
      maxLevel: 3,
      title: hintObj.title,
      content: hintObj.content,
      canProgress: safeLevel < 3,
      nudge: safeLevel === 1 
        ? 'This is a high-level conceptual nudge. If you still need more details, request Hint Level 2.'
        : safeLevel === 2
        ? 'This hint outlines the specific approach. If you need structural pseudocode, request Hint Level 3.'
        : 'This is the algorithmic blueprint. Write the C++ implementation to verify your understanding!'
    };
  }

  // 3. TEST MY UNDERSTANDING (Check / Mini-tracing)
  if (action === 'test') {
    // Pick check based on mistake category or cycle through
    const checks = probData.checks;
    let selectedCheck = checks[0];

    if (diag?.category === 'EDGE_CASE_FAILURE' && checks.length > 1) {
      selectedCheck = checks[1];
    } else if (checks.length > 1 && (Number(hintLevel) % 2 === 0)) {
      selectedCheck = checks[1];
    }

    return {
      question: selectedCheck.question,
      options: selectedCheck.options,
      correctIndex: selectedCheck.correctIndex,
      explanation: selectedCheck.explanation,
      problemContext: probData.title
    };
  }

  return {
    error: 'UNKNOWN_ACTION',
    message: `Action '${action}' is not supported. Use 'explain', 'hint', or 'test'.`
  };
}

// ─── External AI Provider Integration (Gemini / OpenAI) ──────────────────────
async function callExternalAiProvider({ action, problemId, problemTitle, topic, difficulty, problemSummary, userCode, submissionOutcome, hintLevel }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return null; // Provider not configured
  }

  const diag = submissionOutcome?.diagnosis;
  const status = submissionOutcome?.status || 'NOT_SUBMITTED';

  const systemPrompt = `You are an expert DSA (Data Structures and Algorithms) Learning Coach and Pedagogical Mentor.
Your mission is to help students learn how to solve problems independently in C++.
CRITICAL CONSTRAINTS:
1. NEVER output the full or copy-paste C++ solution code.
2. Provide Socratic questioning, conceptual nudges, and targeted debugging advice.
3. Keep answers concise, encouraging, and pedagogically sound.
4. Strictly return your response in valid JSON matching the requested structure.`;

  const userPrompt = `Student Context:
- Problem: "${problemTitle}" (${topic}, ${difficulty})
- Summary: ${problemSummary || 'Standard DSA problem'}
- Submission Status: ${status}
- Diagnosis Category: ${diag?.category || 'None'}
- Compiler/Runtime Note: ${submissionOutcome?.compilerError || submissionOutcome?.runtimeError || 'None'}
- Current Student Code:
\`\`\`cpp
${(userCode || '').slice(0, 1500)}
\`\`\`
- Action Requested: "${action}" (Hint Level requested: ${hintLevel || 1})

Required Output JSON schemas:
For action 'explain':
{"title": "...", "category": "${diag?.category || 'LOGIC'}", "explanation": "...", "details": "...", "nextStep": "..."}

For action 'hint':
{"level": ${hintLevel || 1}, "maxLevel": 3, "title": "...", "content": "...", "canProgress": ${hintLevel < 3}, "nudge": "..."}

For action 'test':
{"question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "explanation": "..."}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000); // 7s timeout

  try {
    // 1. Google Gemini API
    if (geminiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt + '\n\n' + userPrompt }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timer);
      if (!resp.ok) return null;

      const data = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;
      return JSON.parse(rawText);
    }

    // 2. OpenAI API
    if (openaiKey) {
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timer);
      if (!resp.ok) return null;

      const data = await resp.json();
      const rawContent = data?.choices?.[0]?.message?.content;
      if (!rawContent) return null;

      // Extract JSON
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    }
  } catch (err) {
    clearTimeout(timer);
    // On any API or network error, silently return null to trigger deterministic fallback
    return null;
  }

  return null;
}

// ─── Main Public Coach Handler ────────────────────────────────────────────────
/**
 * Handle a coaching request with strict security & fallback guarantees.
 */
async function handleCoachRequest(params) {
  const {
    action = 'explain',
    problemId,
    problemTitle = 'Problem',
    topic = 'Algorithms',
    difficulty = 'Easy',
    problemSummary = '',
    userCode = '',
    submissionOutcome = null,
    hintLevel = 1,
    isBlindMode = false,
    attemptHistory = []
  } = params || {};

  // 1. Blind Solve Mode Protection (Constraint #11)
  if (isBlindMode) {
    return {
      ok: false,
      blockedByBlindMode: true,
      message: 'Learning Coach is disabled during Blind Solve Challenge Mode to protect independent problem-solving. Exit Blind Solve mode to access coach guidance.'
    };
  }

  // 2. Attempt AI provider if configured (GEMINI_API_KEY / OPENAI_API_KEY)
  let aiResponse = null;
  try {
    aiResponse = await callExternalAiProvider({
      action,
      problemId,
      problemTitle,
      topic,
      difficulty,
      problemSummary,
      userCode,
      submissionOutcome,
      hintLevel
    });
  } catch (_) {
    aiResponse = null;
  }

  if (aiResponse && !aiResponse.error) {
    return {
      ok: true,
      source: 'ai',
      action,
      data: aiResponse
    };
  }

  // 3. Robust Deterministic Fallback (Constraint #8)
  const deterministicData = generateDeterministicResponse({
    action,
    problemId,
    problemTitle,
    topic,
    userCode,
    submissionOutcome,
    hintLevel,
    attemptHistory
  });

  return {
    ok: true,
    source: 'deterministic',
    action,
    data: deterministicData
  };
}

module.exports = {
  handleCoachRequest,
  generateDeterministicResponse,
  PROBLEM_KNOWLEDGE
};
