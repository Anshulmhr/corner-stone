// Exercise the real browser-to-API collection path. Only the external compiler is stubbed.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import app from '../server/index.js';
import pilotRoutes from '../server/pilot/routes.js';
import store from '../server/pilot/store.js';
import analysis from '../server/pilot/dataset.js';
import fixtures from '../server/testSuites.js';

const tmp = mkdtempSync(join(tmpdir(), 'corner-stone-pilot-ui-'));
process.env.PILOT_DB_PATH = join(tmp, 'test.sqlite');
delete process.env.GEMINI_API_KEY;
delete process.env.OPENAI_API_KEY;
const server = app.listen(0, '127.0.0.1');
const originalFetch = global.fetch;
const code = '// browser fixture without a real submission';
const suite = fixtures.TEST_SUITES['two-sum'];
const outputs = new Map(
  suite.publicCases.map((c) => [suite.buildHarness(code, c.id), suite.expectedOutputs[c.id]])
);
global.fetch = async (url, opts) => {
  assert.equal(new URL(url).hostname, 'wandbox.org');
  const value = outputs.get(JSON.parse(opts.body).code);
  assert.ok(value);
  return Response.json({ status: '0', program_output: value });
};
let browser, db;
try {
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1400, height: 940 } });
  const errors = [],
    badEvents = [];
  let requests = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.url().includes('/api/pilot/')) requests++;
  });
  page.on('response', (r) => {
    if (r.url().includes('/api/pilot/') && r.status() >= 400) badEvents.push([r.url(), r.status()]);
  });
  await page.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.origin !== origin || /[/]monacoSetup-[^/]+[.]js$/.test(u.pathname)) return r.abort();
    return r.continue();
  });
  const button = (name) => page.getByRole('button', { name, exact: true });
  await page.goto(origin);
  await button('Start Solving').scrollIntoViewIfNeeded();
  assert.equal(requests, 0);
  assert.equal(existsSync(process.env.PILOT_DB_PATH), false);
  await button('Join training pilot').click();
  await button('Leave pilot and delete my data').waitFor();
  db = store.openStore();
  await button('Start Solving').click();
  await page.getByLabel('Prior familiarity').selectOption('new');
  await page.getByRole('button', { name: /Unlock Hint 1/ }).click();
  await page.getByRole('textbox', { name: 'Solution code' }).fill(code);
  await button('Run & Submit C++ Code').click();
  await page.getByText(/All 4\/4 automated test cases passed/).waitFor();
  const model = analysis.dataset(db);
  assert.equal(model.examples.length, 1);
  assert.equal(model.examples[0].label, 0);
  assert.ok(model.recommendations.some((r) => r.opened && r.attempted));
  await page.getByRole('button', { name: /Cognitive Understanding & Reflection/ }).click();
  const explanation = 'Synthetic pilot explanation from a browser check.';
  await page.getByPlaceholder(/^Explain how your solution works/).fill(explanation);
  await button('Evaluate Cognitive Understanding').click();
  assert.equal(analysis.dataset(db, true).explanations.length, 0);
  await page.getByRole('checkbox', { name: /Share this explanation/ }).check();
  await button('Evaluate Cognitive Understanding').click();
  await page.getByText(/Assessment saved\. Explanation shared with pilot reviewers/).waitFor();
  assert.equal(analysis.dataset(db, true).explanations[0].text, explanation);
  await button('Demo Data').click();
  await button('Return to my progress').waitFor();
  const before = requests;
  await page.locator('aside').getByRole('button', { name: 'Problems', exact: true }).click();
  await page.locator('.problem-card').filter({ hasText: 'Two Sum' }).click();
  await button('Log Practice').click();
  assert.equal(requests, before);
  await button('Return to my progress').click();
  await button('Leave pilot and delete my data').click();
  await button('Join training pilot').waitFor();
  assert.equal(db.prepare('SELECT count(*) AS n FROM events').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM learners').get().n, 0);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('adaptivedsa_solved_ids'))), [
    'two-sum',
  ]);
  assert.deepEqual(errors, []);
  assert.deepEqual(badEvents, []);
  console.log(
    'PASS: opt-in, recommendation uptake, hint, first judge result, explicit reflection sharing, demo isolation and withdrawal.'
  );
} finally {
  global.fetch = originalFetch;
  await browser?.close();
  db?.close();
  await new Promise((r) => server.close(r));
  pilotRoutes.closeStore();
  rmSync(tmp, { recursive: true, force: true });
}
