import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, afterEach, before, test } from 'node:test';
import app from './server/index.js';
import fixtures from './server/testSuites.js';
import { getAttempts, recordAttempt } from './src/services/storage.js';

const httpFetch = globalThis.fetch;
const suite = fixtures.TEST_SUITES['two-sum'];
const userCode = '// test transport';
const casesBySource = new Map(suite.publicCases.map(tc => [suite.buildHarness(userCode, tc.id), tc]));
let server, endpoint;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  endpoint = 'http://127.0.0.1:' + server.address().port + '/api/execute';
});
afterEach(() => { globalThis.fetch = httpFetch; });
after(() => new Promise(resolve => server.close(resolve)));

async function execute(respond, problemId = 'two-sum') {
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).hostname, 'wandbox.org');
    const tc = casesBySource.get(JSON.parse(options.body).code);
    assert.ok(tc, 'provider received an unexpected harness');
    return respond(tc);
  };
  const res = await httpFetch(endpoint, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ problemId, userCode })
  });
  return { http: res.status, body: await res.json() };
}

test('server binds each sandbox answer to exactly one case', async () => {
  const ok = tc => Response.json({ status: '0', program_output: suite.expectedOutputs[tc.id] });
  const accepted = await execute(ok);
  assert.equal(accepted.body.status, 'ACCEPTED');
  assert.equal(accepted.body.passedCount, 4);
  const wrong = await execute(tc => tc.id === 3
    ? Response.json({ status: '0', program_output: 'CASE:3:OUT:[0, 2]' }) : ok(tc));
  assert.equal(wrong.body.status, 'WRONG_ANSWER');
  assert.equal(wrong.body.passedCount, 3);
  assert.equal(wrong.body.results[3].actualOutput, '[Incorrect]');
  for (const extra of ['[0,1]\n[0,1]', 'prefix [0,1]', '["0",1]']) {
    assert.equal(fixtures.gradeCase(suite, suite.publicCases[0], extra).passed, false);
  }
});

test('a dropped connection can recover without double-counting a case', async () => {
  let dropped = false;
  const { body } = await execute(tc => {
    if (tc.id === 1 && !dropped) {
      dropped = true;
      throw new TypeError('connection reset');
    }
    return Response.json({ status: '0', program_output: suite.expectedOutputs[tc.id] });
  });
  assert.equal(body.status, 'ACCEPTED');
  assert.equal(body.passedCount, 4);
  assert.equal(body.results.length, 4);
});

test('provider outages and malformed responses produce no learner verdict', async () => {
  for (const fail of [
    () => new Response('busy', { status: 429 }),
    () => Response.json({ error: 'provider unavailable' }),
    () => { throw new DOMException('deadline', 'AbortError'); }
  ]) {
    const { http, body } = await execute(tc => tc.id === 3 ? fail() :
      Response.json({ status: '0', program_output: suite.expectedOutputs[tc.id] }));
    assert.equal(http, 503);
    assert.equal(body.status, 'EXECUTION_FAILED');
    assert.equal(body.totalCount, 0);
    assert.deepEqual(body.results, []);
    assert.equal(body.diagnosis, null);
  }
});

test('real compile errors, runtime signals and program CPU limits remain distinct', async () => {
  const compile = await execute(() => Response.json({ status: '1', compiler_error: 'error: invalid syntax' }));
  assert.equal(compile.body.status, 'COMPILATION_ERROR');
  const runtime = await execute(tc => tc.id === 3
    ? Response.json({ signal: 'Aborted', program_error: 'private hidden input' })
    : Response.json({ status: '0', program_output: suite.expectedOutputs[tc.id] }));
  assert.equal(runtime.body.status, 'RUNTIME_ERROR');
  assert.ok(!JSON.stringify(runtime.body).includes('private hidden input'));
  const limit = await execute(() => Response.json({ signal: 'CPU time limit exceeded' }));
  assert.equal(limit.body.status, 'TIME_LIMIT_EXCEEDED');
  assert.equal(limit.body.judged, true);
  const missing = await execute(() => assert.fail(), 'constructor');
  assert.equal(missing.body.status, 'UNSUPPORTED_PROBLEM');
});

test('manual and legacy attempts retain practice history without false Blind Solve credit', () => {
  const memory = new Map();
  globalThis.localStorage = { getItem: k => memory.get(k), setItem: (k,v) => memory.set(k,v) };
  const legacy = { problemId: 'two-sum', evaluationType: 'manual', success: true,
    status: 'ACCEPTED', isBlindSolve: true, independenceScore: 100 };
  memory.set('adaptivedsa_attempts_log', JSON.stringify([legacy, {status:'TIME_LIMIT_EXCEEDED'}]));
  for (const status of ['EXECUTION_FAILED','RATE_LIMITED','EMPTY_SUBMISSION','UNSUPPORTED_PROBLEM']) {
    assert.equal(recordAttempt({ status, success:false }), null);
  }
  recordAttempt(legacy);
  assert.equal(getAttempts().length, 2);
  for (const attempt of getAttempts()) {
    assert.equal(attempt.status, 'SELF_REPORTED');
    assert.equal(attempt.isBlindSolve, false);
    assert.equal(attempt.independenceScore, null);
  }
  recordAttempt({ problemId: 'two-sum', status: 'TIME_LIMIT_EXCEEDED', success: false, judged: true });
  assert.equal(getAttempts()[0].status, 'TIME_LIMIT_EXCEEDED');
});
