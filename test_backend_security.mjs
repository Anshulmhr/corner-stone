const correct = `#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        std::unordered_map<int,int> m;
        for (int i=0;i<(int)nums.size();i++) {
            if (m.count(target-nums[i])) return {m[target-nums[i]], i};
            m[nums[i]] = i;
        }
        return {};
    }
};`;

const wrong = `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {0, 0};
    }
};`;

const badCode = `#include <vector>
class Solution {
public:
    vector<int twoSum() { // syntax error
    }
};`;

async function test(label, body) {
  const resp = await fetch('http://127.0.0.1:3001/api/execute', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const d = await resp.json();
  console.log(`\n=== ${label} ===`);
  console.log('HTTP:', resp.status);
  console.log('Status:', d.status);
  if (d.passedCount !== undefined) console.log('Passed:', d.passedCount + '/' + d.totalCount);
  if (d.results) {
    const hidden = d.results.filter(r => r.isHidden);
    hidden.forEach(r => {
      const exposed = r.inputDisplay !== 'Hidden test input' && r.inputDisplay !== null;
      const expOutExposed = r.expectedOutput !== '[Protected]';
      console.log('  Hidden result:', r.name,
        '| inputDisplay:', r.inputDisplay,
        '| expectedOutput:', r.expectedOutput,
        '| actualOutput:', r.actualOutput,
        exposed ? '🔴 INPUT EXPOSED' : '✅ input protected',
        expOutExposed ? '🔴 EXPECTED EXPOSED' : '✅ expected protected'
      );
    });
  }
  if (d.compilerError) console.log('CompilerError (first 200):', d.compilerError.slice(0,200));
}

async function run() {
  await test('ACCEPTED - correct two-sum', { problemId: 'two-sum', userCode: correct });
  await test('WRONG ANSWER - bad two-sum', { problemId: 'two-sum', userCode: wrong });
  await test('COMPILE ERROR - syntax error', { problemId: 'two-sum', userCode: badCode });
  await test('EMPTY SUBMISSION', { problemId: 'two-sum', userCode: '   ' });
  await test('UNSUPPORTED PROBLEM', { problemId: 'fake-problem', userCode: correct });
  await test('RATE LIMIT - valid-anagram correct', {
    problemId: 'valid-anagram',
    userCode: `#include <string>
#include <algorithm>
using namespace std;
class Solution {
public:
    bool isAnagram(string s, string t) {
        sort(s.begin(),s.end()); sort(t.begin(),t.end()); return s==t;
    }
};`
  });
  console.log('\nAll backend tests complete.');
}
run().catch(e => console.error('Fatal:', e));
