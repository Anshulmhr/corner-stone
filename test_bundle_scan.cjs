const fs = require('fs');
const assets = fs.readdirSync('dist/assets');
const jsFile = assets.find(f => f.endsWith('.js'));
const bundle = fs.readFileSync('dist/assets/' + jsFile, 'utf8');

const checks = [
  ['Hidden input listen/silent',    'listen", t = "silent'],
  ['Hidden input -3,4,3,90',        '-3, 4, 3, 90'],
  ['Hidden expected [0, 2]',        '[0, 2]'],
  ['buildHarness function',         'buildHarness'],
  ['compareOutputs function',       'compareOutputs'],
  // NOTE: 'expectedOutput' as a string is used as a React prop name in TestResultsPanel.jsx
  //       (renders the value sent back from the server, which is '[Protected]' for hidden tests).
  //       Actual expected output VALUES are what must not be present — checked above.
  ['Wandbox URL',                   'wandbox.org'],
  ['Direct compile endpoint',       'compile.json'],
  ['CASE:3:OUT harness sentinel',   'CASE:3:OUT'],
  ['Gemini API URL',                'generativelanguage.googleapis.com'],
  ['OpenAI API URL',                'api.openai.com'],
  ['GEMINI_API_KEY env secret',     'GEMINI_API_KEY'],
  ['OPENAI_API_KEY env secret',     'OPENAI_API_KEY'],
  ['Hidden harness makeCycleList',  'makeCycleList'],
  ['Hidden harness printTree',      'printTree'],
  ['Hidden input -1,-7,7,-4,19',    '-1, -7, 7, -4, 19'],
  ['Hidden output 8,1,5,4...',      '[8, 1, 5, 4, 3, 2, 1, 1, 0, 0]'],
];

let anyFail = false;
checks.forEach(function(pair) {
  const label = pair[0];
  const needle = pair[1];
  const found = bundle.includes(needle);
  console.log((found ? 'EXPOSED: ' : 'CLEAN:   ') + label);
  if (found) anyFail = true;
});

const apiPresent = bundle.includes('/api/execute');
console.log(apiPresent ? 'PRESENT: /api/execute proxy call' : 'MISSING: /api/execute');

const coachPresent = bundle.includes('/api/coach');
console.log(coachPresent ? 'PRESENT: /api/coach proxy call' : 'MISSING: /api/coach');
if (!coachPresent) anyFail = true;

console.log('');
console.log(anyFail ? 'WARNING: Sensitive strings found in bundle!' : 'PASS: Bundle is clean - no hidden test data.');
console.log('Bundle file: ' + jsFile + ' | Size: ' + (bundle.length / 1024).toFixed(1) + 'KB');
