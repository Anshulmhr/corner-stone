/**
 * src/services/intelligenceEngine.js
 *
 * Adaptive Problem-Solving Intelligence Engine (Core Service)
 *
 * Responsibilities:
 *  1. Capture and distinguish OBSERVED EVIDENCE (sandbox tests, attempts, hints, quiz answers)
 *     from ESTIMATED UNDERSTANDING (approach quality, complexity analysis, conceptual reasoning).
 *  2. Refuse to fabricate scores when evidence is missing, returning explicit 'insufficient_evidence' states.
 *  3. Maintain 5 separate, uncoupled pedagogical dimensions with transparent calculation steps:
 *       - Implementation Ability (Observed Telemetry)
 *       - Independence from Assistance (Observed Telemetry)
 *       - Complexity Analysis (Observed Stated Claim vs. Canonical Knowledge)
 *       - Conceptual Understanding (Estimated Cognitive Grasp)
 *       - Algorithm & Approach Selection (Estimated Strategy Selection)
 *  4. Adhere strictly to pedagogical rules:
 *       - A passing submission does NOT imply conceptual mastery.
 *       - A failing submission does NOT imply conceptual misunderstanding.
 *       - Keyword matching / heuristics are treated explicitly as ESTIMATES with disclaimers.
 *  5. Select appropriate next learning actions based strictly on available evidence.
 *  6. Track longitudinal growth in student autonomy and recurring misconceptions over time.
 */

// ─── Canonical Complexity & Concept Knowledge Base for all 20 Problems ────────
export const PROBLEM_KNOWLEDGE_BASE = {
  'two-sum': {
    title: 'Two Sum',
    topic: 'Arrays',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Hash Map (Single-Pass Lookup)',
      timeKeywords: ['o(n)', 'linear', 'o(n) time'],
      spaceKeywords: ['o(n)', 'linear', 'hash map', 'hash table', 'unordered_map']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(1)',
      approachName: 'Nested Loop Brute Force'
    },
    conceptualAnchors: ['complement', 'hash', 'map', 'unordered_map', 'target -', 'seen', 'pair', 'lookup', 'index'],
    commonMisconceptions: [
      { id: 'SORT_INDEX_LOSS', trigger: /sort/i, explanation: 'Sorting takes O(n log n) and disrupts initial indices, requiring extra index tracking.' }
    ]
  },
  'best-time-to-buy-and-sell-stock': {
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: 'Single-Pass Dynamic Tracking',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(1)',
      approachName: 'All-Pairs Comparison'
    },
    conceptualAnchors: ['min price', 'minimum', 'lowest', 'max profit', 'single pass', 'buy', 'difference', 'so far'],
    commonMisconceptions: [
      { id: 'FUTURE_BUY', trigger: /max.*min.*before/i, explanation: 'Cannot buy in the future and sell in the past; traversal must maintain temporal order.' }
    ]
  },
  'valid-anagram': {
    title: 'Valid Anagram',
    topic: 'Strings',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(1)', // 26 alphabet characters is bounded O(1) auxiliary space
      approachName: 'Character Frequency Counting',
      timeKeywords: ['o(n)', 'linear', 'o(s + t)'],
      spaceKeywords: ['o(1)', 'constant', 'o(26)', 'o(k)']
    },
    canonicalSuboptimal: {
      time: 'O(n log n)',
      space: 'O(1)',
      approachName: 'Sorting Strings'
    },
    conceptualAnchors: ['frequency', 'count', 'hash', 'bucket', '26', 'alphabet', 'table', 'increment', 'decrement'],
    commonMisconceptions: []
  },
  'longest-substring-without-repeating-characters': {
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Strings',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(min(m, n))',
      approachName: 'Sliding Window with Hash Set/Map',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(k)', 'o(min(m,n))', 'o(n)', 'set', 'hash']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(n)',
      approachName: 'Nested Substring Checking'
    },
    conceptualAnchors: ['sliding window', 'two pointer', 'left', 'right', 'set', 'duplicate', 'window', 'shrink', 'expand'],
    commonMisconceptions: []
  },
  'binary-search': {
    title: 'Binary Search',
    topic: 'Binary Search',
    canonicalOptimal: {
      time: 'O(log n)',
      space: 'O(1)',
      approachName: 'Iterative Search Space Halving',
      timeKeywords: ['o(log n)', 'logarithmic', 'o(logn)'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: 'Linear Search'
    },
    conceptualAnchors: ['mid', 'left', 'right', 'half', 'divide', 'sorted', 'search space', 'pivot', 'eliminate'],
    commonMisconceptions: [
      { id: 'OFF_BY_ONE_BOUND', trigger: /left < right/i, explanation: 'Using left < right instead of left <= right can miss the target when search space has 1 element.' }
    ]
  },
  'search-in-rotated-sorted-array': {
    title: 'Search in Rotated Sorted Array',
    topic: 'Binary Search',
    canonicalOptimal: {
      time: 'O(log n)',
      space: 'O(1)',
      approachName: 'Modified Binary Search with Sorted Half Detection',
      timeKeywords: ['o(log n)', 'logarithmic'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: 'Linear Scan'
    },
    conceptualAnchors: ['rotated', 'sorted half', 'pivot', 'mid', 'left <= mid', 'boundary', 'in range'],
    commonMisconceptions: []
  },
  'reverse-linked-list': {
    title: 'Reverse Linked List',
    topic: 'Linked Lists',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: 'Iterative Three-Pointer Redirection',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Recursive Stack or Array Buffer'
    },
    conceptualAnchors: ['prev', 'curr', 'next', 'pointer', 'redirect', 'null', 'temp', 'link'],
    commonMisconceptions: []
  },
  'merge-two-sorted-lists': {
    title: 'Merge Two Sorted Lists',
    topic: 'Linked Lists',
    canonicalOptimal: {
      time: 'O(n + m)',
      space: 'O(1)',
      approachName: 'Two-Pointer Splicing with Dummy Head',
      timeKeywords: ['o(n + m)', 'o(n)', 'linear'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O((n + m) log(n + m))',
      space: 'O(n + m)',
      approachName: 'Collect Elements and Sort'
    },
    conceptualAnchors: ['dummy', 'head', 'pointer', 'compare', 'next', 'splice', 'tail', 'remaining'],
    commonMisconceptions: []
  },
  'valid-parentheses': {
    title: 'Valid Parentheses',
    topic: 'Stacks',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'LIFO Monotonic Stack Matching',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(n)', 'linear', 'stack']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(n)',
      approachName: 'String Replace Scanning'
    },
    conceptualAnchors: ['stack', 'push', 'pop', 'open', 'close', 'match', 'top', 'lifo', 'empty'],
    commonMisconceptions: [
      { id: 'COUNT_ONLY', trigger: /counter|count/i, explanation: 'Using simple count integers fails on interleaved braces like "([)]".' }
    ]
  },
  'maximum-depth-of-binary-tree': {
    title: 'Maximum Depth of Binary Tree',
    topic: 'Trees',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(h)',
      approachName: 'Recursive Depth-First Search (DFS)',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(h)', 'o(n)', 'height', 'recursion stack']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(n)',
      approachName: 'Redundant Subtree Traversals'
    },
    conceptualAnchors: ['recursion', 'depth', 'height', 'max', 'left', 'right', 'base case', 'null', '1 + max'],
    commonMisconceptions: []
  },
  'contains-duplicate': {
    title: 'Contains Duplicate',
    topic: 'Arrays',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Hash Set Membership Check',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(n)', 'hash set', 'unordered_set']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(1)',
      approachName: 'Brute Force Pair Comparison'
    },
    conceptualAnchors: ['set', 'hash', 'seen', 'duplicate', 'insert', 'membership', 'unordered_set'],
    commonMisconceptions: []
  },
  'product-of-array-except-self': {
    title: 'Product of Array Except Self',
    topic: 'Arrays',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(1)', // excluding output array as standard
      approachName: 'Prefix and Suffix Cumulative Products',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(1)', 'constant', 'o(n)']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(1)',
      approachName: 'Nested Loops per Element'
    },
    conceptualAnchors: ['prefix', 'suffix', 'left', 'right', 'cumulative', 'product', 'two pass', 'division'],
    commonMisconceptions: [
      { id: 'DIVISION_DISALLOWED', trigger: /divide|division/i, explanation: 'Problem constraints disallow the division operator and must handle zeroes safely.' }
    ]
  },
  'valid-palindrome': {
    title: 'Valid Palindrome',
    topic: 'Strings',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: 'In-Place Two-Pointer Convergent Scan',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Filtered String Reversal'
    },
    conceptualAnchors: ['two pointer', 'left', 'right', 'alphanumeric', 'lowercase', 'converge', 'skip'],
    commonMisconceptions: []
  },
  'find-minimum-in-rotated-sorted-array': {
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'Binary Search',
    canonicalOptimal: {
      time: 'O(log n)',
      space: 'O(1)',
      approachName: 'Binary Search for Inflection Pivot',
      timeKeywords: ['o(log n)', 'logarithmic'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: 'Linear Minimum Scan'
    },
    conceptualAnchors: ['mid', 'right', 'pivot', 'inflection', 'binary search', 'sorted half', 'unsorted'],
    commonMisconceptions: []
  },
  'daily-temperatures': {
    title: 'Daily Temperatures',
    topic: 'Stacks',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Monotonic Decreasing Stack of Indices',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(n)', 'stack']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(1)',
      approachName: 'Nested Forward Scans'
    },
    conceptualAnchors: ['monotonic stack', 'decreasing', 'indices', 'warmer', 'pop', 'distance', 'stack'],
    commonMisconceptions: []
  },
  'evaluate-reverse-polish-notation': {
    title: 'Evaluate Reverse Polish Notation',
    topic: 'Stacks',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Operand Stack Evaluation',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(n)', 'stack']
    },
    canonicalSuboptimal: {
      time: 'O(n^2)',
      space: 'O(n)',
      approachName: 'Repeated String Reduction'
    },
    conceptualAnchors: ['stack', 'operand', 'operator', 'pop two', 'push result', 'evaluate', 'order'],
    commonMisconceptions: [
      { id: 'OPERAND_ORDER', trigger: /b - a|b \/ a/i, explanation: 'In RPN, top element is second operand: first popped is right, second is left (left op right).' }
    ]
  },
  'linked-list-cycle': {
    title: 'Linked List Cycle',
    topic: 'Linked Lists',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: "Floyd's Tortoise and Hare (Two-Pointers)",
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Hash Set of Visited Nodes'
    },
    conceptualAnchors: ['fast', 'slow', 'cycle', 'floyd', 'tortoise', 'hare', 'meet', 'two pointer', 'null check'],
    commonMisconceptions: []
  },
  'middle-of-the-linked-list': {
    title: 'Middle of the Linked List',
    topic: 'Linked Lists',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(1)',
      approachName: 'Fast and Slow Pointer (Runner Technique)',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(1)', 'constant']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Two-Pass Length Counting or Array Collection'
    },
    conceptualAnchors: ['fast', 'slow', 'runner', 'two steps', 'one step', 'middle', 'halfway'],
    commonMisconceptions: []
  },
  'same-tree': {
    title: 'Same Tree',
    topic: 'Trees',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(h)',
      approachName: 'Simultaneous Recursive Traversal',
      timeKeywords: ['o(n)', 'linear', 'o(min(p, q))'],
      spaceKeywords: ['o(h)', 'o(n)', 'recursion stack']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Serialize and Compare'
    },
    conceptualAnchors: ['recursion', 'same value', 'both null', 'one null', 'structural', 'left and right'],
    commonMisconceptions: []
  },
  'invert-binary-tree': {
    title: 'Invert Binary Tree',
    topic: 'Trees',
    canonicalOptimal: {
      time: 'O(n)',
      space: 'O(h)',
      approachName: 'Recursive Subtree Swapping (DFS)',
      timeKeywords: ['o(n)', 'linear'],
      spaceKeywords: ['o(h)', 'o(n)', 'recursion stack']
    },
    canonicalSuboptimal: {
      time: 'O(n)',
      space: 'O(n)',
      approachName: 'Iterative BFS Queue Inversion'
    },
    conceptualAnchors: ['swap', 'recursion', 'invert', 'left', 'right', 'children', 'mirror', 'base case'],
    commonMisconceptions: []
  }
};

// ─── Canonical Comprehension Tracing Checks for all 20 Problems ───────────────
export const CANONICAL_CHECKS = {
  'two-sum': {
    id: 'two-sum-check',
    question: 'Tracing check: Given nums = [3, 2, 4] and target = 6, when the loop inspects index 1 (value 2), what complement value does the hash map look for?',
    options: [
      '4 (because 6 - 2 = 4)',
      '3 (because 6 - 3 = 3)',
      '2 (because the current element is 2)',
      '6 (the target value itself)'
    ],
    correctIndex: 0,
    explanation: 'The complement is target - nums[i] = 6 - 2 = 4. Since 4 is not yet in the map, 2 is stored with index 1.'
  },
  'best-time-to-buy-and-sell-stock': {
    id: 'stock-check',
    question: 'Tracing check: Given prices = [7, 1, 5, 3], what are minPrice and maxProfit after processing day 3 (price = 5)?',
    options: [
      'minPrice = 1, maxProfit = 4',
      'minPrice = 7, maxProfit = 5',
      'minPrice = 1, maxProfit = 5',
      'minPrice = 5, maxProfit = 2'
    ],
    correctIndex: 0,
    explanation: 'Day 1 price was 7, day 2 dropped minPrice to 1. On day 3 (price 5), profit is 5 - 1 = 4, so maxProfit becomes 4.'
  },
  'valid-anagram': {
    id: 'anagram-check',
    question: 'Why is verifying sum(ASCII values of s) == sum(ASCII values of t) insufficient to determine if two strings are anagrams?',
    options: [
      'Different character combinations can produce identical sums (e.g. "ad" has ASCII sum 97+100=197, while "bc" has 98+99=197)',
      'C++ cannot sum ASCII char values',
      'String length check always prevents anagrams with equal ASCII sums',
      'ASCII values in C++ are unsigned and cause integer overflow'
    ],
    correctIndex: 0,
    explanation: 'ASCII sum has collisions. Distinct strings like "ad" and "bc" have identical sums but different frequencies.'
  },
  'longest-substring-without-repeating-characters': {
    id: 'longest-substring-check',
    question: 'When a duplicate character is encountered at index right, why can the left pointer advance directly past its previous occurrence?',
    options: [
      'Any substring starting at or before the previous occurrence will still contain the duplicate character',
      'Because all characters between left and right must be erased from memory',
      'To reset the window size to zero',
      'To force time complexity to O(n²)'
    ],
    correctIndex: 0,
    explanation: 'Advancing left past the previous occurrence eliminates the duplicate from the active sliding window.'
  },
  'binary-search': {
    id: 'binary-search-check',
    question: 'In binary search on sorted array [-1, 0, 3, 5, 9, 12] with target = 9, what is the value at mid on the first iteration?',
    options: [
      '3 (index 2: (0+5)/2 = 2)',
      '5 (index 3)',
      '0 (index 1)',
      '9 (index 4)'
    ],
    correctIndex: 0,
    explanation: 'Initial bounds are left = 0, right = 5. mid = (0 + 5)/2 = 2. nums[2] is 3.'
  },
  'search-in-rotated-sorted-array': {
    id: 'rotated-search-check',
    question: 'In a rotated sorted array, how do we determine whether the left half [left...mid] is sorted?',
    options: [
      'Check if nums[left] <= nums[mid]',
      'Check if nums[mid] > nums[right]',
      'Check if nums[left] < target',
      'Rotate the entire array back to index 0 first'
    ],
    correctIndex: 0,
    explanation: 'If nums[left] <= nums[mid], the left subarray has no rotation inflection point and is strictly ascending.'
  },
  'reverse-linked-list': {
    id: 'reverse-list-check',
    question: 'During iterative linked list reversal, why must we save curr->next in a temporary pointer before executing curr->next = prev?',
    options: [
      'Because changing curr->next breaks the reference to the remainder of the unreversed list',
      'Because C++ pointers require two copies to prevent null pointer exceptions',
      'To free the memory of the reversed node',
      'It is not necessary; prev->next can be used instead'
    ],
    correctIndex: 0,
    explanation: 'Redirection overwrites curr->next; without saving the original next pointer, access to the remainder of the list is lost.'
  },
  'merge-two-sorted-lists': {
    id: 'merge-lists-check',
    question: 'What is the primary benefit of initializing a dummy head node before merging two sorted linked lists?',
    options: [
      'It provides a stable head anchor and avoids special-case null checks for the first element',
      'It prevents heap memory allocation',
      'It automatically sorts both lists in O(1)',
      'It eliminates the need for pointer comparisons'
    ],
    correctIndex: 0,
    explanation: 'A dummy node provides a fixed root pointer, so list splicing logic is uniform for every node.'
  },
  'valid-parentheses': {
    id: 'valid-parentheses-check',
    question: 'Why does a simple counter integer fail to validate expressions with multiple bracket types like "([)]"?',
    options: [
      'Counters do not track the last-in-first-out (LIFO) matching order required for nested brackets',
      'Because counters cannot handle curly braces',
      'Counters cause integer overflow in C++',
      'Counters only work for strings of length less than 10'
    ],
    correctIndex: 0,
    explanation: 'Counters only measure total count balance, failing to catch interleaved bracket mismatches like "([)]".'
  },
  'maximum-depth-of-binary-tree': {
    id: 'max-depth-check',
    question: 'What is the recurrence relation for the maximum depth of a binary tree with root node?',
    options: [
      'maxDepth(root) = 1 + max(maxDepth(root->left), maxDepth(root->right))',
      'maxDepth(root) = maxDepth(root->left) + maxDepth(root->right)',
      'maxDepth(root) = 2 * maxDepth(root->left)',
      'maxDepth(root) = max(root->val, maxDepth(root->left))'
    ],
    correctIndex: 0,
    explanation: 'Depth is 1 (for the root node itself) plus the greater depth of its left or right child subtrees.'
  },
  'contains-duplicate': {
    id: 'contains-duplicate-check',
    question: 'What is the average time complexity of checking and inserting elements into an std::unordered_set<int> in C++?',
    options: [
      'O(1) average time per operation',
      'O(n) average time per operation',
      'O(log n) average time per operation',
      'O(n²) time'
    ],
    correctIndex: 0,
    explanation: 'Hash set lookups and insertions operate in O(1) average time with proper hash distribution.'
  },
  'product-of-array-except-self': {
    id: 'product-array-check',
    question: 'Why does product of array except self require two prefix and suffix passes when division is disallowed?',
    options: [
      'The product for any element i equals (product of all elements before i) * (product of all elements after i)',
      'Because arrays cannot be multiplied in a single pass in C++',
      'To prevent floating-point rounding errors',
      'Two passes are required only when the array contains negative numbers'
    ],
    correctIndex: 0,
    explanation: 'Every element result is the product of its prefix elements multiplied by its suffix elements.'
  },
  'valid-palindrome': {
    id: 'valid-palindrome-check',
    question: 'In a two-pointer palindrome check, what condition terminates the traversal when characters all match?',
    options: [
      'When the left pointer meets or crosses the right pointer (left >= right)',
      'When left reaches nums.length()',
      'When right reaches 0',
      'When an uppercase character is encountered'
    ],
    correctIndex: 0,
    explanation: 'When left >= right, the two pointers have verified all mirrored character pairs.'
  },
  'find-minimum-in-rotated-sorted-array': {
    id: 'find-min-rotated-check',
    question: 'In find minimum in rotated sorted array, if nums[mid] > nums[right], where must the minimum element reside?',
    options: [
      'In the right half: between mid + 1 and right',
      'In the left half: between left and mid',
      'At index 0 strictly',
      'At index right strictly'
    ],
    correctIndex: 0,
    explanation: 'If nums[mid] > nums[right], the rotation inflection boundary is in the right subarray, so the minimum is in (mid, right].'
  },
  'daily-temperatures': {
    id: 'daily-temperatures-check',
    question: 'Why do we store day indices rather than temperature values on the monotonic stack in Daily Temperatures?',
    options: [
      'To compute the number of days waited: currentDay - previousDayIndex',
      'Because C++ stacks cannot store integer temperatures',
      'To reduce memory usage from 8 bytes to 4 bytes',
      'To sort the temperatures in ascending order'
    ],
    correctIndex: 0,
    explanation: 'Storing indices allows instant distance calculation (i - stack.top()) and access to the original temperature.'
  },
  'evaluate-reverse-polish-notation': {
    id: 'rpn-check',
    question: 'When evaluating an operator like subtraction (-) in RPN, which popped operand is the subtrahend (the value being subtracted)?',
    options: [
      'The first popped value is the second operand (subtrahend): result = secondPopped - firstPopped',
      'The first popped value is the first operand: result = firstPopped - secondPopped',
      'Either order produces the identical result in subtraction',
      'The top of the stack is always added to the bottom of the stack'
    ],
    correctIndex: 0,
    explanation: 'In RPN, "a b -" evaluates to a - b. The top of the stack is b (first popped), and the next is a (second popped).'
  },
  'linked-list-cycle': {
    id: 'll-cycle-check',
    question: "In Floyd's cycle finding algorithm, if a cycle exists, why must the fast pointer eventually catch the slow pointer?",
    options: [
      'The distance between them decreases by 1 node with every step inside the cycle loop',
      'Because the fast pointer reverses direction inside the loop',
      'Because the slow pointer eventually stops moving',
      'It only catches up if the cycle length is an even number'
    ],
    correctIndex: 0,
    explanation: 'Relative to slow, fast closes the gap by exactly 1 node per iteration, guaranteeing intersection without skipping.'
  },
  'middle-of-the-linked-list': {
    id: 'middle-ll-check',
    question: 'When fast moves 2 steps and slow moves 1 step, where is slow when fast reaches the end (fast == null or fast->next == null)?',
    options: [
      'Slow is at the exact middle (or second middle for even length lists)',
      'Slow is at the first quarter of the list',
      'Slow is at the penultimate node',
      'Slow is pointing to null'
    ],
    correctIndex: 0,
    explanation: 'Since slow travels at half the speed of fast, when fast reaches the end, slow has traversed exactly half the distance.'
  },
  'same-tree': {
    id: 'same-tree-check',
    question: 'In recursive tree comparison, what is the base case when both p and q are null?',
    options: [
      'Return true (both subtrees are empty and thus structurally identical)',
      'Return false (null trees cannot be compared)',
      'Throw a null pointer exception',
      'Return 0'
    ],
    correctIndex: 0,
    explanation: 'Two null nodes have identical structure and no mismatching values, so the base case returns true.'
  },
  'invert-binary-tree': {
    id: 'invert-tree-check',
    question: 'When inverting a binary tree, what operation is performed at each node before or after recursive calls?',
    options: [
      'Swap the left and right child pointers: std::swap(root->left, root->right)',
      'Invert the integer values inside the node: root->val = -root->val',
      'Reverse the parent pointer',
      'Delete the left child and clone the right child'
    ],
    correctIndex: 0,
    explanation: 'Inverting a tree mirrors it across the vertical axis by swapping left and right child pointers at every node.'
  }
};

export function getProblemComprehensionCheck(problemId) {
  return CANONICAL_CHECKS[problemId] || null;
}

// ─── String & Complexity Normalization Helpers ─────────────────────────────────
export function normalizeComplexity(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/big-?o/g, '')
    .replace(/[^a-z0-9()^]/g, '');
}

function assignTier(score) {
  if (score === null || score === undefined) return 'Insufficient Data';
  if (score >= 85) return 'Proficient';
  if (score >= 65) return 'Competent';
  if (score >= 40) return 'Developing';
  return 'Novice';
}

// ─── DIMENSION 1: Implementation Ability (Observed Telemetry) ─────────────────
/**
 * Evaluates real compilation and runtime execution results.
 * Strictly checks objective sandbox facts.
 *
 * NOTE (Adjustment 6): A passing submission earns a high implementation score,
 * but DOES NOT automatically imply conceptual understanding or optimal algorithm selection.
 */
export function evaluateImplementation({
  submissionStatus = null,
  testsPassed = null,
  totalTests = null,
  executionTimeMs = null,
  mistakeCategory = null
}) {
  if (!submissionStatus && (testsPassed === null || totalTests === null)) {
    return {
      dimension: 'Implementation Ability',
      score: null,
      status: 'insufficient_evidence',
      tier: 'Insufficient Data',
      evidenceType: 'OBSERVED_TELEMETRY',
      observedData: { submissionStatus, testsPassed, totalTests, executionTimeMs },
      calculation: 'No code submission has been executed yet.',
      limitationNote: 'Implementation ability requires at least one code execution attempt.'
    };
  }

  let score = 0;
  let explanation = '';

  if (submissionStatus === 'ACCEPTED') {
    score = 100;
    explanation = `All ${totalTests || 0} automated test cases passed without runtime or memory faults.`;
  } else if (submissionStatus === 'WRONG_ANSWER') {
    const passed = Number(testsPassed) || 0;
    const total = Number(totalTests) || 1;
    const passRatio = passed / total;
    // WRONG_ANSWER with partial pass scores between 30 and 75
    score = Math.round(30 + passRatio * 45);
    explanation = `Passed ${passed} of ${total} tests (${Math.round(passRatio * 100)}%).`;
    if (mistakeCategory === 'BOUNDARY_ERROR') {
      score = Math.min(80, score + 10);
      explanation += ' Logic is largely intact but failed boundary/off-by-one edge condition.';
    } else if (mistakeCategory === 'EDGE_CASE_FAILURE') {
      score = Math.min(75, score + 8);
      explanation += ' Passed visible cases but failed hidden edge inputs.';
    }
  } else if (submissionStatus === 'RUNTIME_ERROR') {
    score = 25;
    explanation = 'Code compiled but crashed during execution (e.g. out-of-bounds access or segmentation fault).';
  } else if (submissionStatus === 'COMPILATION_ERROR') {
    score = 15;
    explanation = 'Code could not be compiled by GCC due to syntax or type mismatch errors.';
  } else if (submissionStatus === 'TIME_LIMIT_EXCEEDED') {
    score = 35;
    explanation = 'Execution exceeded time limits (potential infinite loop or asymptotic inefficiency).';
  } else {
    // Incomplete or unverified
    score = 20;
    explanation = 'Submission incomplete or unverified.';
  }

  return {
    dimension: 'Implementation Ability',
    score,
    status: 'observed',
    tier: assignTier(score),
    evidenceType: 'OBSERVED_TELEMETRY',
    observedData: {
      submissionStatus,
      testsPassed,
      totalTests,
      executionTimeMs,
      mistakeCategory
    },
    calculation: explanation,
    limitationNote: 'Implementation ability measures test passing correctness, not code design quality or reasoning.'
  };
}

// ─── DIMENSION 2: Independence from Assistance (Observed Telemetry) ───────────
/**
 * Evaluates reliance on hints, attempts count, and Blind Solve challenge mode.
 * Based purely on empirical interaction counts.
 */
export function evaluateIndependence({
  hintsUnlocked = 0,
  attemptCount = 0,
  isBlindSolve = false,
  submissionStatus = null
}) {
  if (attemptCount === 0 && hintsUnlocked === 0 && !isBlindSolve) {
    return {
      dimension: 'Independence from Assistance',
      score: null,
      status: 'insufficient_evidence',
      tier: 'Insufficient Data',
      evidenceType: 'OBSERVED_TELEMETRY',
      observedData: { hintsUnlocked, attemptCount, isBlindSolve },
      calculation: 'No practice attempts or hint interactions recorded yet.',
      limitationNote: 'Independence requires at least one attempt or hint interaction.'
    };
  }

  // Base score derived from hint level requested
  let baseScore = 100;
  let hintDeduction = 0;
  if (hintsUnlocked === 1) {
    hintDeduction = 25; // Nudge used
  } else if (hintsUnlocked === 2) {
    hintDeduction = 45; // Approach blueprint used
  } else if (hintsUnlocked >= 3) {
    hintDeduction = 70; // Full algorithm blueprint used
  }
  baseScore -= hintDeduction;

  // Attempt penalty: multiple unsuccessful attempts slightly lower independence
  let attemptDeduction = 0;
  if (attemptCount > 1) {
    attemptDeduction = Math.min(20, (attemptCount - 1) * 5);
  }
  baseScore -= attemptDeduction;

  // Blind solve bonus (if attempted under blind challenge conditions)
  let blindBonus = 0;
  if (isBlindSolve) {
    blindBonus = 10;
    baseScore += blindBonus;
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(baseScore)));

  const explanation = [
    `Base 100`,
    hintDeduction > 0 ? `-${hintDeduction} pts for ${hintsUnlocked} hint(s)` : `+0 hint deduction (zero hints)`,
    attemptDeduction > 0 ? `-${attemptDeduction} pts for ${attemptCount} attempts` : `first-attempt solve`,
    blindBonus > 0 ? `+${blindBonus} pts for Blind Solve mode` : null
  ].filter(Boolean).join(', ') + ` = ${finalScore}/100.`;

  return {
    dimension: 'Independence from Assistance',
    score: finalScore,
    status: 'observed',
    tier: assignTier(finalScore),
    evidenceType: 'OBSERVED_TELEMETRY',
    observedData: {
      hintsUnlocked,
      attemptCount,
      isBlindSolve,
      submissionStatus
    },
    calculation: explanation,
    limitationNote: 'Independence measures self-reliance for this session and is not a generalized measure of aptitude.'
  };
}

// ─── DIMENSION 3: Complexity Analysis (Observed Stated Claim vs. Reality) ─────
/**
 * Evaluates student's stated Time Complexity and Space Complexity against canonical bounds.
 * Does NOT guess if student did not provide complexity claims.
 */
export function evaluateComplexity({
  statedTime = null,
  statedSpace = null,
  complexityReasoning = null,
  problemId = null
}) {
  const hasTime = Boolean(statedTime && statedTime.trim());
  const hasSpace = Boolean(statedSpace && statedSpace.trim());
  const hasReasoning = Boolean(complexityReasoning && complexityReasoning.trim());

  if (!hasTime && !hasSpace && !hasReasoning) {
    return {
      dimension: 'Complexity Analysis',
      score: null,
      status: 'insufficient_evidence',
      tier: 'Insufficient Data',
      evidenceType: 'OBSERVED_CLAIM_VS_CANONICAL',
      observedData: { statedTime, statedSpace, hasReasoning },
      calculation: 'Student has not submitted a time or space complexity claim.',
      limitationNote: 'Complexity analysis cannot be evaluated without a student-provided complexity statement.'
    };
  }

  const knowledge = PROBLEM_KNOWLEDGE_BASE[problemId];
  if (!knowledge) {
    // Problem without knowledge base entry: evaluate general syntactic validity
    const score = hasTime && hasSpace ? 60 : 35;
    return {
      dimension: 'Complexity Analysis',
      score,
      status: 'observed',
      tier: assignTier(score),
      evidenceType: 'OBSERVED_CLAIM_VS_CANONICAL',
      observedData: { statedTime, statedSpace, hasReasoning },
      calculation: `Complexity syntax recognized (${statedTime || 'none'}, ${statedSpace || 'none'}) but canonical bounds for problem '${problemId}' not configured.`,
      limitationNote: 'Unregistered problem complexity calibration.'
    };
  }

  const canonical = knowledge.canonicalOptimal;
  const normStatedTime = normalizeComplexity(statedTime);
  const normStatedSpace = normalizeComplexity(statedSpace);

  // Time Complexity Evaluation (up to 50 pts)
  let timePts = 0;
  let timeNote = '';
  const timeMatchesOptimal = canonical.timeKeywords.some(kw => normStatedTime.includes(normalizeComplexity(kw)));
  const timeMatchesSuboptimal = knowledge.canonicalSuboptimal &&
    normStatedTime.includes(normalizeComplexity(knowledge.canonicalSuboptimal.time));

  if (timeMatchesOptimal) {
    timePts = 50;
    timeNote = `Stated time (${statedTime}) matches canonical optimal ${canonical.time}.`;
  } else if (timeMatchesSuboptimal) {
    timePts = 35;
    timeNote = `Stated time (${statedTime}) matches recognized brute-force/sub-optimal bound (${knowledge.canonicalSuboptimal.time}).`;
  } else if (hasTime) {
    timePts = 15;
    timeNote = `Stated time (${statedTime}) does not match optimal (${canonical.time}).`;
  } else {
    timeNote = 'Time complexity not stated.';
  }

  // Space Complexity Evaluation (up to 35 pts)
  let spacePts = 0;
  let spaceNote = '';
  const spaceMatchesOptimal = canonical.spaceKeywords.some(kw => normStatedSpace.includes(normalizeComplexity(kw)));
  const spaceMatchesSuboptimal = knowledge.canonicalSuboptimal &&
    normStatedSpace.includes(normalizeComplexity(knowledge.canonicalSuboptimal.space));

  if (spaceMatchesOptimal) {
    spacePts = 35;
    spaceNote = `Stated space (${statedSpace}) matches canonical optimal ${canonical.space}.`;
  } else if (spaceMatchesSuboptimal) {
    spacePts = 25;
    spaceNote = `Stated space (${statedSpace}) matches recognized suboptimal approach space (${knowledge.canonicalSuboptimal.space}).`;
  } else if (hasSpace) {
    spacePts = 10;
    spaceNote = `Stated space (${statedSpace}) does not match canonical (${canonical.space}).`;
  } else {
    spaceNote = 'Space complexity not stated.';
  }

  // Reasoning Depth (up to 15 pts)
  let reasoningPts = 0;
  if (hasReasoning) {
    const rLower = complexityReasoning.toLowerCase();
    const matchesStructuralAnchor = knowledge.conceptualAnchors.some(a => rLower.includes(a.toLowerCase()));
    if (complexityReasoning.length > 25 && matchesStructuralAnchor) {
      reasoningPts = 15;
    } else if (complexityReasoning.length > 10) {
      reasoningPts = 10;
    } else {
      reasoningPts = 5;
    }
  }

  const finalScore = Math.min(100, timePts + spacePts + reasoningPts);
  const calculation = `${timeNote} ${spaceNote} ${reasoningPts > 0 ? `Reasoning bonus (+${reasoningPts} pts).` : ''}`.trim();

  return {
    dimension: 'Complexity Analysis',
    score: finalScore,
    status: 'observed',
    tier: assignTier(finalScore),
    evidenceType: 'OBSERVED_CLAIM_VS_CANONICAL',
    observedData: {
      statedTime,
      statedSpace,
      complexityReasoning,
      canonicalOptimalTime: canonical.time,
      canonicalOptimalSpace: canonical.space
    },
    calculation,
    limitationNote: 'Evaluates the concordance of student asymptotic claims with canonical computer science complexity.'
  };
}

// ─── DIMENSION 4: Conceptual Understanding (Estimated Cognitive Grasp) ────────
/**
 * Estimates conceptual grasp from comprehension check answers, student explanation,
 * and hint dependence.
 *
 * NOTE (Adjustment 5): Keyword and pattern matching are ESTIMATES, not definitive proof of cognition.
 * NOTE (Adjustment 6): A failing code submission with sound conceptual explanation can still earn
 * a solid conceptual score.
 */
export function evaluateConceptualUnderstanding({
  comprehensionCheck = null, // { answered: boolean, isCorrect: boolean, questionId?: string }
  approachText = null,
  hintsUnlocked = 0,
  problemId = null
}) {
  const hasQuiz = Boolean(comprehensionCheck && comprehensionCheck.answered);
  const hasText = Boolean(approachText && approachText.trim());

  if (!hasQuiz && !hasText) {
    return {
      dimension: 'Conceptual Understanding',
      score: null,
      status: 'insufficient_evidence',
      tier: 'Insufficient Data',
      evidenceType: 'ESTIMATED_COGNITIVE',
      observedData: { hasQuiz, hasText, hintsUnlocked },
      calculation: 'No comprehension check answered and no student explanation provided.',
      limitationNote: 'Conceptual understanding cannot be estimated without an explanation or comprehension check.'
    };
  }

  const knowledge = PROBLEM_KNOWLEDGE_BASE[problemId];
  let quizComponent = null;
  let textComponent = null;

  // 1. Comprehension Check (Objective quiz answer)
  if (hasQuiz) {
    quizComponent = comprehensionCheck.isCorrect ? 90 : 30;
  }

  // 2. Approach Text Qualitative Analysis
  if (hasText) {
    const textLower = approachText.toLowerCase();
    const anchors = knowledge ? knowledge.conceptualAnchors : [];
    const matchedAnchors = anchors.filter(a => textLower.includes(a.toLowerCase()));

    // Check for explicit misconceptions
    const misconceptions = knowledge ? knowledge.commonMisconceptions : [];
    const matchedMisconceptions = misconceptions.filter(m => m.trigger.test(textLower));

    let textScore = 30; // base for attempting explanation
    if (matchedAnchors.length >= 3) {
      textScore = 85;
    } else if (matchedAnchors.length >= 2) {
      textScore = 70;
    } else if (matchedAnchors.length === 1) {
      textScore = 55;
    }

    if (matchedMisconceptions.length > 0) {
      textScore = Math.max(25, textScore - 25);
    }

    textComponent = textScore;
  }

  // Combine available components
  let score = 0;
  let calcDesc = '';

  if (quizComponent !== null && textComponent !== null) {
    score = Math.round(quizComponent * 0.5 + textComponent * 0.5);
    calcDesc = `Comprehension quiz (${quizComponent}/100) + approach explanation (${textComponent}/100) balanced estimate = ${score}/100.`;
  } else if (quizComponent !== null) {
    score = quizComponent;
    calcDesc = `Comprehension check result (${quizComponent}/100).`;
  } else {
    score = textComponent;
    calcDesc = `Rule-based conceptual anchor evaluation (${textComponent}/100).`;
  }

  // Hint dependence discount: if user needed Level 3 Blueprint, cap maximum conceptual score at 70
  if (hintsUnlocked >= 3 && score > 70) {
    score = 70;
    calcDesc += ' Capped at 70 because full algorithmic blueprint hint was required.';
  }

  return {
    dimension: 'Conceptual Understanding',
    score,
    status: 'observed',
    tier: assignTier(score),
    evidenceType: 'ESTIMATED_COGNITIVE',
    observedData: {
      hasQuiz,
      quizCorrect: comprehensionCheck?.isCorrect || false,
      hasText,
      hintsUnlocked
    },
    calculation: calcDesc,
    limitationNote: 'Estimated via structured rubric and keyword anchors. Treat as a diagnostic heuristic, not psychometric truth.'
  };
}

// ─── DIMENSION 5: Algorithm & Approach Selection (Estimated Strategy Selection)
/**
 * Evaluates whether the chosen algorithmic strategy is optimal, sub-optimal, or invalid.
 */
export function evaluateAlgorithmSelection({
  approachText = null,
  statedTime = null,
  codeLength = 0,
  submissionStatus = null,
  problemId = null
}) {
  const hasText = Boolean(approachText && approachText.trim());
  const hasTime = Boolean(statedTime && statedTime.trim());

  if (!hasText && !hasTime && !submissionStatus) {
    return {
      dimension: 'Algorithm & Approach Selection',
      score: null,
      status: 'insufficient_evidence',
      tier: 'Insufficient Data',
      evidenceType: 'ESTIMATED_STRATEGY',
      observedData: { hasText, hasTime, submissionStatus },
      calculation: 'No approach description or algorithmic evidence provided.',
      limitationNote: 'Algorithm selection requires either approach description, complexity claim, or submission code.'
    };
  }

  const knowledge = PROBLEM_KNOWLEDGE_BASE[problemId];
  let score = 50; // default baseline for unclassified
  let rationale = '';

  if (knowledge) {
    const textLower = (approachText || '').toLowerCase();
    const normTime = normalizeComplexity(statedTime);
    const optimalTimeNorm = normalizeComplexity(knowledge.canonicalOptimal.time);
    const suboptimalTimeNorm = knowledge.canonicalSuboptimal
      ? normalizeComplexity(knowledge.canonicalSuboptimal.time)
      : '';

    const matchedAnchors = knowledge.conceptualAnchors.filter(a => textLower.includes(a.toLowerCase()));

    if (normTime === optimalTimeNorm || matchedAnchors.length >= 2) {
      score = 90;
      rationale = `Identified optimal strategy: ${knowledge.canonicalOptimal.approachName}.`;
    } else if (normTime === suboptimalTimeNorm || textLower.includes('brute force') || textLower.includes('nested')) {
      score = 55;
      rationale = `Selected valid but sub-optimal approach (${knowledge.canonicalSuboptimal?.approachName || 'Brute Force'}).`;
    } else if (hasText) {
      score = 65;
      rationale = 'Described algorithmic approach with partial pattern alignment.';
    } else if (submissionStatus === 'ACCEPTED') {
      score = 80;
      rationale = 'Code accepted across all tests, indicating viable algorithm implementation.';
    } else {
      score = 40;
      rationale = 'Algorithmic strategy unclear or incomplete.';
    }
  } else {
    score = submissionStatus === 'ACCEPTED' ? 80 : 50;
    rationale = submissionStatus === 'ACCEPTED' ? 'Solution accepted across test suites.' : 'Heuristic estimate.';
  }

  return {
    dimension: 'Algorithm & Approach Selection',
    score,
    status: 'observed',
    tier: assignTier(score),
    evidenceType: 'ESTIMATED_STRATEGY',
    observedData: { hasText, hasTime, submissionStatus },
    calculation: rationale,
    limitationNote: 'Algorithm selection evaluates strategy suitability relative to optimal time/space complexity bounds.'
  };
}

// ─── ACTION SELECTOR: Pedagogical Decision Engine ─────────────────────────────
/**
 * Maps multidimensional diagnostic outcomes directly to actionable learning recommendations.
 */
export function selectPedagogicalAction({
  dimensions,
  observedEvidence,
  problemId,
  topic
}) {
  const {
    implementationAbility: impl,
    independence: indep,
    complexityAnalysis: comp,
    conceptualUnderstanding: concept,
    algorithmSelection: algo
  } = dimensions;

  // 1. Insufficient Evidence Fallback
  const availableScores = [impl, indep, comp, concept, algo].filter(d => d.score !== null);
  if (availableScores.length === 0) {
    return {
      actionType: 'INSUFFICIENT_DATA',
      badge: 'Begin Practice',
      reason: 'No problem-solving evidence has been recorded for this question yet.',
      pedagogicalObjective: 'Submit your solution or explain your approach to receive cognitive assessment.',
      basedOnEvidence: ['No recorded submissions or explanations']
    };
  }

  // 2. High Implementation, Low Complexity Analysis
  if (impl.score !== null && impl.score >= 80 && comp.score !== null && comp.score < 60) {
    return {
      actionType: 'COMPLEXITY_DRILL',
      badge: 'Complexity Reflection Needed',
      reason: 'Your code passed all tests, but your time/space complexity analysis was incomplete or inaccurate.',
      pedagogicalObjective: 'Study why this algorithm scales asymptotically before advancing to harder constraints.',
      basedOnEvidence: [
        `Implementation Score: ${impl.score}/100 (Pass)`,
        `Complexity Score: ${comp.score}/100 (Needs Improvement)`
      ]
    };
  }

  // 3. High Implementation, Low Independence (Hint Heavy)
  if (impl.score !== null && impl.score >= 80 && indep.score !== null && indep.score < 55) {
    return {
      actionType: 'BLIND_CHALLENGE',
      badge: 'Independent Recall Challenge',
      reason: 'You reached an accepted solution, but relied significantly on hints or multiple submissions.',
      pedagogicalObjective: 'Re-solve a similar problem in Blind Solve Challenge Mode without hints to consolidate retention.',
      basedOnEvidence: [
        `Implementation: ${impl.score}/100`,
        `Independence: ${indep.score}/100 (${observedEvidence.hintsUnlocked} hint(s) unlocked)`
      ]
    };
  }

  // 4. Failing Implementation, Sound Conceptual Understanding
  if (impl.score !== null && impl.score < 80 && concept.score !== null && concept.score >= 65) {
    return {
      actionType: 'EDGE_CASE_REMEDIATION',
      badge: 'Edge-Case Debugging',
      reason: 'You understand the core algorithm well, but your implementation failed on specific test boundary conditions.',
      pedagogicalObjective: 'Trace null pointers, empty inputs, or off-by-one loop conditions rather than changing the whole approach.',
      basedOnEvidence: [
        `Conceptual Grasp: ${concept.score}/100 (Sound)`,
        `Implementation: ${impl.score}/100 (${observedEvidence.submissionStatus || 'Failed'})`
      ]
    };
  }

  // 5. Low Conceptual Understanding
  if (concept.score !== null && concept.score < 50) {
    return {
      actionType: 'CONCEPT_REVISION',
      badge: 'Foundational Concept Review',
      reason: 'The evidence suggests an incomplete mental model of the underlying data structure or invariant.',
      pedagogicalObjective: 'Review progressive coach hints or tracing checks to understand the underlying pattern.',
      basedOnEvidence: [
        `Conceptual Score: ${concept.score}/100`,
        observedEvidence.comprehensionCheck?.answered ? 'Comprehension check revealed misconception' : 'Missing core conceptual anchors'
      ]
    };
  }

  // 6. Mastery across all evaluated dimensions
  const allProficient = availableScores.every(d => d.score >= 80);
  if (allProficient && availableScores.length >= 3) {
    return {
      actionType: 'ADVANCE_DIFFICULTY',
      badge: 'Advance Challenge',
      reason: 'You demonstrated strong implementation, independent execution, and sound complexity reasoning.',
      pedagogicalObjective: 'Tackle a higher difficulty or adjacent prerequisite problem in the curriculum.',
      basedOnEvidence: availableScores.map(d => `${d.dimension}: ${d.score}/100`)
    };
  }

  // Default Standard Progression
  return {
    actionType: 'PRACTICE_SIMILAR',
    badge: 'Curriculum Progression',
    reason: 'Continue practicing topic problems to build established evidence across all cognitive dimensions.',
    pedagogicalObjective: 'Strengthen problem-solving intuition through repetitive application.',
    basedOnEvidence: availableScores.map(d => `${d.dimension}: ${d.score}/100`)
  };
}

// ─── PRIMARY SERVICE ENTRY POINT: Assess Problem Solving ──────────────────────
/**
 * Evaluates student problem-solving session and produces a comprehensive assessment object.
 *
 * @param {object} params
 * @param {string} params.problemId
 * @param {string} [params.problemTitle]
 * @param {string} [params.topic]
 * @param {string} [params.difficulty]
 * @param {object} params.evidence - Raw observed evidence
 * @returns {object} - Structured Understanding Assessment
 */
export function assessProblemSolving({
  problemId,
  problemTitle = '',
  topic = '',
  difficulty = 'Easy',
  evidence = {}
}) {
  const {
    submissionStatus = null,
    testsPassed = null,
    totalTests = null,
    executionTimeMs = null,
    mistakeCategory = null,
    hintsUnlocked = 0,
    attemptCount = 0,
    isBlindSolve = false,
    blindSolveTimeSeconds = null,
    statedTimeComplexity = null,
    statedSpaceComplexity = null,
    complexityReasoning = null,
    approachExplanation = null,
    comprehensionCheck = null
  } = evidence;

  // 1. Separate evaluation across all 5 dimensions
  const implEval = evaluateImplementation({
    submissionStatus,
    testsPassed,
    totalTests,
    executionTimeMs,
    mistakeCategory
  });

  const indepEval = evaluateIndependence({
    hintsUnlocked,
    attemptCount,
    isBlindSolve,
    submissionStatus
  });

  const compEval = evaluateComplexity({
    statedTime: statedTimeComplexity,
    statedSpace: statedSpaceComplexity,
    complexityReasoning,
    problemId
  });

  const conceptEval = evaluateConceptualUnderstanding({
    comprehensionCheck,
    approachText: approachExplanation,
    hintsUnlocked,
    problemId
  });

  const algoEval = evaluateAlgorithmSelection({
    approachText: approachExplanation,
    statedTime: statedTimeComplexity,
    submissionStatus,
    problemId
  });

  const dimensions = {
    implementationAbility: implEval,
    independence: indepEval,
    complexityAnalysis: compEval,
    conceptualUnderstanding: conceptEval,
    algorithmSelection: algoEval
  };

  // 2. Composite Score Calculation (ONLY from dimensions with observed evidence)
  const availableDims = Object.values(dimensions).filter(d => d.score !== null);
  let compositeScore = null;
  let evidenceReliability = 'insufficient';

  if (availableDims.length >= 4) {
    evidenceReliability = 'established';
    const sum = availableDims.reduce((acc, d) => acc + d.score, 0);
    compositeScore = Math.round(sum / availableDims.length);
  } else if (availableDims.length >= 2) {
    evidenceReliability = 'moderate';
    const sum = availableDims.reduce((acc, d) => acc + d.score, 0);
    compositeScore = Math.round(sum / availableDims.length);
  } else {
    evidenceReliability = 'insufficient';
    compositeScore = null; // Refuse to fabricate overall number with insufficient evidence
  }

  // 3. Recommended Action
  const recommendedAction = selectPedagogicalAction({
    dimensions,
    observedEvidence: evidence,
    problemId,
    topic
  });

  return {
    assessmentId: 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    problemId,
    problemTitle,
    topic,
    difficulty,
    timestamp: new Date().toISOString(),

    // Explicit Observed Facts
    observedEvidence: {
      submissionStatus,
      testsPassed,
      totalTests,
      executionTimeMs,
      mistakeCategory,
      hintsUnlocked,
      attemptCount,
      isBlindSolve,
      blindSolveTimeSeconds,
      statedTimeComplexity,
      statedSpaceComplexity,
      hasComplexityReasoning: Boolean(complexityReasoning && complexityReasoning.trim()),
      hasApproachExplanation: Boolean(approachExplanation && approachExplanation.trim()),
      comprehensionCheck: comprehensionCheck || null
    },

    // 5 Independent Dimensions
    dimensions,

    // Overall Summary
    overallSummary: {
      compositeScore,
      evidenceReliability,
      availableDimensionsCount: availableDims.length,
      totalDimensionsCount: 5,
      calculationBasis: compositeScore !== null
        ? `Mean of ${availableDims.length} evaluated dimensions (${availableDims.map(d => `${d.dimension}: ${d.score}`).join(', ')}).`
        : 'Insufficient evidence to compute reliable composite understanding score.'
    },

    // Pedagogical Recommendation
    recommendedAction,

    // Academic & Diagnostic Disclaimers
    disclaimer: 'The estimated understanding scores and diagnostic categories are pedagogical formative tools to guide student practice. They are not an accredited psychometric measure of intelligence or cognitive capacity.'
  };
}

// ─── LONGITUDINAL TRAJECTORY TRACKING ─────────────────────────────────────────
/**
 * Analyzes multiple historical assessments to detect trends in student autonomy and recurring misconceptions.
 */
export function evaluateLongitudinalTrajectory(assessmentHistory = []) {
  if (!Array.isArray(assessmentHistory) || assessmentHistory.length === 0) {
    return {
      hasData: false,
      totalAssessments: 0,
      independenceTrend: 'insufficient_data',
      recurringMisconceptions: [],
      growthSummary: 'No historical assessments available yet.'
    };
  }

  // Sort chronological ascending
  const sorted = [...assessmentHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const independenceScores = sorted
    .map(a => a.dimensions?.independence?.score)
    .filter(s => s !== null && s !== undefined);

  let independenceTrend = 'stable';
  if (independenceScores.length >= 3) {
    const first = independenceScores[0];
    const last = independenceScores[independenceScores.length - 1];
    if (last - first >= 15) {
      independenceTrend = 'improving';
    } else if (first - last >= 15) {
      independenceTrend = 'declining';
    }
  }

  // Detect recurring mistake patterns across sessions
  const mistakeCounts = {};
  sorted.forEach(a => {
    const cat = a.observedEvidence?.mistakeCategory;
    if (cat) {
      mistakeCounts[cat] = (mistakeCounts[cat] || 0) + 1;
    }
  });

  const recurringMisconceptions = Object.entries(mistakeCounts)
    .filter(([_cat, count]) => count >= 2)
    .map(([cat, count]) => ({
      category: cat,
      occurrences: count,
      note: `Detected ${count} occurrences across historical submissions.`
    }));

  return {
    hasData: true,
    totalAssessments: sorted.length,
    evaluatedSessions: independenceScores.length,
    independenceTrend,
    latestIndependenceScore: independenceScores.length > 0 ? independenceScores[independenceScores.length - 1] : null,
    recurringMisconceptions,
    growthSummary: independenceTrend === 'improving'
      ? 'Student shows measurable growth in solving problems with fewer hints and higher self-reliance.'
      : independenceTrend === 'declining'
      ? 'Student is increasingly relying on hints on recent problems; review foundational prerequisites.'
      : 'Autonomy level remains consistent across evaluated sessions.'
  };
}
