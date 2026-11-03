// Offline regression test. Only compile the fixed fixtures imported below.
// Production submissions always run in the remote sandbox.
'use strict';
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { TEST_SUITES, gradeCase } = require('./server/testSuites.js');
const { CORRECT, WRONG } = require('./test_grading_correctness.cjs');

async function main() {
  const { PROBLEMS } = await import('./src/data/problems.js');
  const ids = PROBLEMS.map(p => p.id).sort();
  assert.deepEqual(CORRECT.map(p => p.id).sort(), ids, 'missing reference solutions');
  assert.deepEqual(Object.keys(TEST_SUITES).sort(), ids, 'harness coverage');

  const work = mkdtempSync(join(tmpdir(), 'adaptivedsa-grading-'));
  const binary = join(work, process.platform === 'win32' ? 'case.exe' : 'case');
  let acceptedCases = 0;
  try {
    for (const fixture of [...CORRECT, ...WRONG]) {
      const suite = TEST_SUITES[fixture.id];
      let passed = 0;
      for (const tc of suite.publicCases) {
        const source = suite.buildHarness(fixture.code, tc.id);
        execFileSync(process.env.CXX || 'g++', ['-std=c++17', '-x', 'c++', '-', '-o', binary],
          { input: source, stdio: ['pipe', 'pipe', 'pipe'], timeout: 20000 });
        const output = execFileSync(binary, [], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 2000 });
        const result = gradeCase(suite, tc, output);
        if (result.passed) passed++;
        if (result.isHidden) {
          assert.equal(result.inputDisplay, 'Hidden test input');
          assert.equal(result.expectedOutput, '[Protected]');
          assert.ok(['[Correct]', '[Incorrect]'].includes(result.actualOutput));
        }
      }
      if (fixture.label) {
        assert.ok(passed < suite.totalCount, fixture.label + ' was incorrectly accepted');
      } else {
        assert.equal(passed, suite.totalCount, fixture.id);
        acceptedCases += passed;
      }
      console.log(fixture.id, fixture.label || 'reference', passed + '/' + suite.totalCount);
    }
    console.log(acceptedCases + ' reference cases passed. ' + WRONG.length + ' incorrect solutions rejected.');
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
