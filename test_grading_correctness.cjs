'use strict';
/**
 * Grading Correctness Integration Test — AdaptiveDSA
 *
 * Sections:
 *  1. Correct reference solutions → ACCEPTED for all 13 graded problems
 *  2. Deliberately wrong solutions → WRONG_ANSWER (never ACCEPTED)
 *  3. Compilation error → COMPILATION_ERROR
 *  4. Runtime crash → RUNTIME_ERROR
 *  5. Edge cases (empty, unsupported)
 *  6. Blind-mode coach block → HTTP 403
 *  7. Compilation success ≠ ACCEPTED without correct output
 */

const BASE = 'http://127.0.0.1:3001';
let passed = 0, failed = 0;

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}

function chk(label, condition, detail) {
  if (condition) {
    console.log('  \u2713 PASS:', label);
    passed++;
  } else {
    console.error('  \u2717 FAIL:', label, detail ? ('-- ' + detail) : '');
    failed++;
  }
}

function checkHidden(result, id) {
  if (!result.results) return;
  const hidden = result.results.filter(r => r.isHidden);
  for (const h of hidden) {
    chk(id + ' hidden-input protected', h.inputDisplay === 'Hidden test input', 'got: ' + h.inputDisplay);
    chk(id + ' hidden-expected protected', h.expectedOutput === '[Protected]', 'got: ' + h.expectedOutput);
  }
}

// ── Section 1: Correct solutions ─────────────────────────────────────────────
const CORRECT = [
  {
    id: 'two-sum',
    code: [
      '#include <vector>',
      '#include <unordered_map>',
      'using namespace std;',
      'class Solution { public:',
      '  vector<int> twoSum(vector<int>& nums, int target) {',
      '    unordered_map<int,int> m;',
      '    for (int i=0;i<(int)nums.size();i++) {',
      '      int c=target-nums[i]; if(m.count(c)) return{m[c],i}; m[nums[i]]=i;',
      '    } return {};',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'best-time-to-buy-and-sell-stock',
    code: [
      '#include <vector>',
      '#include <algorithm>',
      'using namespace std;',
      'class Solution { public:',
      '  int maxProfit(vector<int>& prices) {',
      '    int mn=1e9, mx=0;',
      '    for(int p:prices){mn=min(mn,p);mx=max(mx,p-mn);}',
      '    return mx;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'valid-anagram',
    code: [
      '#include <string>',
      '#include <vector>',
      'using namespace std;',
      'class Solution { public:',
      '  bool isAnagram(string s, string t) {',
      '    if(s.size()!=t.size()) return false;',
      '    vector<int> cnt(26,0);',
      '    for(char c:s) cnt[c-97]++;',
      '    for(char c:t) if(--cnt[c-97]<0) return false;',
      '    return true;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'contains-duplicate',
    code: [
      '#include <vector>',
      '#include <unordered_set>',
      'using namespace std;',
      'class Solution { public:',
      '  bool containsDuplicate(vector<int>& nums) {',
      '    unordered_set<int> seen;',
      '    for(int x:nums){if(seen.count(x)) return true; seen.insert(x);}',
      '    return false;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'product-of-array-except-self',
    code: [
      '#include <vector>',
      'using namespace std;',
      'class Solution { public:',
      '  vector<int> productExceptSelf(vector<int>& nums) {',
      '    int n=nums.size();',
      '    vector<int> ans(n,1);',
      '    for(int i=1;i<n;i++) ans[i]=ans[i-1]*nums[i-1];',
      '    int suffix=1;',
      '    for(int i=n-1;i>=0;i--){ans[i]*=suffix; suffix*=nums[i];}',
      '    return ans;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'valid-palindrome',
    code: [
      '#include <string>',
      '#include <cctype>',
      'using namespace std;',
      'class Solution { public:',
      '  bool isPalindrome(string s) {',
      '    int l=0, r=(int)s.size()-1;',
      '    while(l<r){',
      '      while(l<r && !isalnum(s[l])) l++;',
      '      while(l<r && !isalnum(s[r])) r--;',
      '      if(tolower(s[l])!=tolower(s[r])) return false;',
      '      l++; r--;',
      '    }',
      '    return true;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'find-minimum-in-rotated-sorted-array',
    code: [
      '#include <vector>',
      'using namespace std;',
      'class Solution { public:',
      '  int findMin(vector<int>& nums) {',
      '    int lo=0, hi=(int)nums.size()-1;',
      '    while(lo<hi){',
      '      int mid=(lo+hi)/2;',
      '      if(nums[mid]>nums[hi]) lo=mid+1; else hi=mid;',
      '    }',
      '    return nums[lo];',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'daily-temperatures',
    code: [
      '#include <vector>',
      '#include <stack>',
      'using namespace std;',
      'class Solution { public:',
      '  vector<int> dailyTemperatures(vector<int>& t) {',
      '    int n=t.size(); vector<int> ans(n,0); stack<int> st;',
      '    for(int i=0;i<n;i++){',
      '      while(!st.empty() && t[i]>t[st.top()]){ans[st.top()]=i-st.top();st.pop();}',
      '      st.push(i);',
      '    }',
      '    return ans;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'evaluate-reverse-polish-notation',
    code: [
      '#include <vector>',
      '#include <string>',
      '#include <stack>',
      'using namespace std;',
      'class Solution { public:',
      '  int evalRPN(vector<string>& tokens) {',
      '    stack<long long> st;',
      '    for(auto& tok:tokens){',
      '      if(tok=="+" || tok=="-" || tok=="*" || tok=="/"){',
      '        long long b=st.top();st.pop();',
      '        long long a=st.top();st.pop();',
      '        if(tok=="+") st.push(a+b);',
      '        else if(tok=="-") st.push(a-b);',
      '        else if(tok=="*") st.push(a*b);',
      '        else st.push((long long)(a/b));',
      '      } else st.push(stoll(tok));',
      '    }',
      '    return (int)st.top();',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'linked-list-cycle',
    code: [
      'class Solution { public:',
      '  bool hasCycle(ListNode *head) {',
      '    ListNode *slow=head, *fast=head;',
      '    while(fast && fast->next){',
      '      slow=slow->next; fast=fast->next->next;',
      '      if(slow==fast) return true;',
      '    }',
      '    return false;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'middle-of-the-linked-list',
    code: [
      'class Solution { public:',
      '  ListNode* middleNode(ListNode* head) {',
      '    ListNode *slow=head, *fast=head;',
      '    while(fast && fast->next){slow=slow->next; fast=fast->next->next;}',
      '    return slow;',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'same-tree',
    code: [
      'class Solution { public:',
      '  bool isSameTree(TreeNode* p, TreeNode* q) {',
      '    if(!p && !q) return true;',
      '    if(!p || !q) return false;',
      '    return p->val==q->val && isSameTree(p->left,q->left) && isSameTree(p->right,q->right);',
      '  }',
      '};'
    ].join('\n')
  },
  {
    id: 'invert-binary-tree',
    code: [
      'class Solution { public:',
      '  TreeNode* invertTree(TreeNode* root) {',
      '    if(!root) return nullptr;',
      '    swap(root->left, root->right);',
      '    invertTree(root->left);',
      '    invertTree(root->right);',
      '    return root;',
      '  }',
      '};'
    ].join('\n')
  }
];

// ── Section 2: Wrong solutions ────────────────────────────────────────────────
const WRONG = [
  {
    id: 'two-sum',
    label: 'always-[0,0]',
    code: ['#include <vector>', 'using namespace std;', 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {0, 0}; } };'].join('\n')
  },
  {
    id: 'contains-duplicate',
    label: 'always-false',
    code: ['#include <vector>', 'using namespace std;', 'class Solution { public: bool containsDuplicate(vector<int>& nums) { return false; } };'].join('\n')
  },
  {
    id: 'valid-palindrome',
    label: 'always-true',
    code: ['#include <string>', 'using namespace std;', 'class Solution { public: bool isPalindrome(string s) { return true; } };'].join('\n')
  },
  {
    id: 'daily-temperatures',
    label: 'empty-result',
    code: ['#include <vector>', 'using namespace std;', 'class Solution { public: vector<int> dailyTemperatures(vector<int>& t) { return {}; } };'].join('\n')
  },
  {
    id: 'find-minimum-in-rotated-sorted-array',
    label: 'returns-first-element',
    code: ['#include <vector>', 'using namespace std;', 'class Solution { public: int findMin(vector<int>& nums) { return nums[0]; } };'].join('\n')
  },
  {
    id: 'evaluate-reverse-polish-notation',
    label: 'returns-zero',
    code: ['#include <vector>', '#include <string>', 'using namespace std;', 'class Solution { public: int evalRPN(vector<string>& tokens) { return 0; } };'].join('\n')
  },
  {
    id: 'linked-list-cycle',
    label: 'always-false',
    code: 'class Solution { public: bool hasCycle(ListNode *head) { return false; } };'
  },
  {
    id: 'same-tree',
    label: 'always-false',
    code: 'class Solution { public: bool isSameTree(TreeNode* p, TreeNode* q) { return false; } };'
  },
  {
    id: 'invert-binary-tree',
    label: 'returns-nullptr',
    code: 'class Solution { public: TreeNode* invertTree(TreeNode* root) { return nullptr; } };'
  }
];

async function main() {
  console.log('=== Grading Correctness Integration Test ===\n');

  // Section 1: correct solutions
  console.log('[Section 1] Correct reference solutions (all 13 must ACCEPT)');
  for (const sol of CORRECT) {
    const r = await post('/api/execute', { problemId: sol.id, userCode: sol.code });
    chk(sol.id + ': ACCEPTED', r.status === 'ACCEPTED', 'got=' + r.status);
    chk(sol.id + ': all ' + r.totalCount + ' tests pass',
      r.passedCount === r.totalCount && r.totalCount > 0,
      'passed=' + r.passedCount + '/' + r.totalCount);
    checkHidden(r, sol.id);
    await new Promise(res => setTimeout(res, 250));
  }

  // Section 2: wrong solutions
  console.log('\n[Section 2] Wrong solutions (must be WRONG_ANSWER, never ACCEPTED)');
  for (const sol of WRONG) {
    const r = await post('/api/execute', { problemId: sol.id, userCode: sol.code });
    chk(sol.id + '[' + sol.label + ']: WRONG_ANSWER',
      r.status === 'WRONG_ANSWER',
      'got=' + r.status + ' passed=' + r.passedCount + '/' + r.totalCount);
    chk(sol.id + '[' + sol.label + ']: passedCount < totalCount',
      r.passedCount < r.totalCount,
      r.passedCount + '/' + r.totalCount);
    await new Promise(res => setTimeout(res, 250));
  }

  // Section 3: compilation error
  console.log('\n[Section 3] Compilation error handling');
  const badCode = 'class Foo { bad syntax ^^^ no semicolons }';
  const cr = await post('/api/execute', { problemId: 'two-sum', userCode: badCode });
  chk('Compilation error -> COMPILATION_ERROR', cr.status === 'COMPILATION_ERROR', 'got=' + cr.status);
  chk('Compilation error -> passedCount=0', cr.passedCount === 0);
  chk('Compilation error -> has compilerError', !!cr.compilerError);

  // Section 4: runtime crash
  console.log('\n[Section 4] Runtime error handling');
  const crashCode = [
    '#include <cstdlib>',
    '#include <vector>',
    'using namespace std;',
    'class Solution { public:',
    '  vector<int> twoSum(vector<int>& nums, int target) { abort(); return {}; }',
    '};'
  ].join('\n');
  const rr = await post('/api/execute', { problemId: 'two-sum', userCode: crashCode });
  chk('Runtime crash -> RUNTIME_ERROR', rr.status === 'RUNTIME_ERROR', 'got=' + rr.status);
  chk('Runtime crash -> passedCount=0', rr.passedCount === 0);

  // Section 5: edge cases
  console.log('\n[Section 5] Edge cases');
  const er = await post('/api/execute', { problemId: 'two-sum', userCode: '   \n  ' });
  chk('Empty submission -> EMPTY_SUBMISSION', er.status === 'EMPTY_SUBMISSION');

  const ur = await post('/api/execute', { problemId: 'binary-search', userCode: 'class Solution{};' });
  chk('Unsupported problem -> UNSUPPORTED_PROBLEM', ur.status === 'UNSUPPORTED_PROBLEM', 'got=' + ur.status);

  // Section 6: blind mode coach block
  console.log('\n[Section 6] Blind-mode coach block (HTTP 403)');
  const blindResp = await fetch(BASE + '/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'hint', problemId: 'two-sum', isBlindMode: true })
  });
  chk('Coach blind mode -> HTTP 403', blindResp.status === 403);
  const blindBody = await blindResp.json();
  chk('Coach blind mode -> blockedByBlindMode=true', blindBody.blockedByBlindMode === true);

  // Section 7: compiles but wrong != ACCEPTED
  console.log('\n[Section 7] Compilation success alone does not equal ACCEPTED');
  const compilesWrongCode = [
    '#include <vector>',
    'using namespace std;',
    'class Solution { public:',
    '  vector<int> twoSum(vector<int>& nums, int target) {',
    '    return {99, 99}; // compiles fine, wrong answer',
    '  }',
    '};'
  ].join('\n');
  const cwr = await post('/api/execute', { problemId: 'two-sum', userCode: compilesWrongCode });
  chk('Compiles but wrong -> NOT ACCEPTED', cwr.status !== 'ACCEPTED', 'got=' + cwr.status);
  chk('Compiles but wrong -> WRONG_ANSWER', cwr.status === 'WRONG_ANSWER', 'got=' + cwr.status);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed === 0) {
    console.log('ALL GRADING CORRECTNESS TESTS PASSED \u2713');
  } else {
    console.log('FAILURES DETECTED: ' + failed + ' test(s) failed');
    process.exit(1);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
