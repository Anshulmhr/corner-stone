import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium } from 'playwright';
import app from '../server/index.js';
import { PROBLEMS } from '../src/data/problems.js';

delete process.env.GEMINI_API_KEY;
delete process.env.OPENAI_API_KEY;
const server = app.listen(0, '127.0.0.1');
let browser;
try {
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  assert.equal((await (await fetch(origin + '/api/health')).json()).ok, true);
  assert.equal((await fetch(origin + '/api/unrecognized')).status, 404);
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1320, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let editorBlocked = false;
  let blockEditor = true;
  const draft = '// local fallback draft for this test';
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (blockEditor && /[/]monacoSetup-[^/]+[.]js$/.test(url.pathname)) {
      editorBlocked = true;
      return route.abort();
    }
    // Browser fixture only. Real C++ return values are tested by test:grading.
    if (url.pathname === '/api/execute') {
      assert.equal(route.request().postDataJSON().userCode, draft);
      return route.fulfill({ json: { status: 'ACCEPTED', passedCount: 4, totalCount: 4,
        results: [], executionTimeMs: 20 } });
    }
    return route.continue();
  });
  const button = (label) => page.getByRole('button', { name: label, exact: true });
  const nav = (label) => page.locator('aside').getByRole('button', { name: label, exact: true });
  const openSolver = async () => {
    await nav('Problems').click();
    await page.locator('.problem-card').filter({ hasText: 'Two Sum' }).click();
  };
  const snapshot = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const reset = async () => {
    page.once('dialog', dialog => dialog.accept());
    await Promise.all([page.waitForNavigation(), button('Reset').click()]);
    await nav('Problems').waitFor();
  };

  await page.goto(origin);
  await button(`Browse ${PROBLEMS.length} Problems`).waitFor();
  await openSolver();
  const editor = page.getByRole('textbox', { name: 'Solution code' });
  await editor.fill(draft);
  await button('Run & Submit C++ Code').click();
  await page.getByText(/All 4\/4 automated test cases passed/).waitFor();
  await page.reload();
  await openSolver();
  assert.equal(await editor.inputValue(), draft);
  assert.ok(editorBlocked, 'Monaco bundle was blocked while editing');
  await page.evaluate(() => {
    localStorage.setItem('adaptivedsa_reflection_draft_old-problem', '{"notes":"old personal reflection"}');
    localStorage.setItem('adaptivedsa_blind_session_old-problem', '{"active":true}');
    localStorage.setItem('unrelated-app', 'keep');
  });
  const personal = await snapshot();
  assert.deepEqual(JSON.parse(personal.adaptivedsa_solved_ids), ['two-sum']);
  await nav('Progress').click();
  await button('Open demo profile').click();
  await button('Return to my progress').waitFor();
  await openSolver();
  assert.notEqual(await editor.inputValue(), draft);
  await editor.fill('// demo-only draft');
  await nav('Progress').click();
  await page.reload();
  await button('Return to my progress').waitFor();
  await openSolver();
  assert.equal(await editor.inputValue(), '// demo-only draft');
  assert.deepEqual(await snapshot(), personal);
  await reset();
  assert.deepEqual(await snapshot(), personal);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('adaptivedsa_attempts_log')), null);
  await button('Return to my progress').click();
  await nav('Demo Data').waitFor();
  await openSolver();
  assert.equal(await editor.inputValue(), draft);
  assert.deepEqual(await snapshot(), personal);
  await reset();
  assert.deepEqual(await snapshot(), { 'unrelated-app': 'keep' });
  blockEditor = false;
  await page.reload();
  await openSolver();
  await page.locator('.monaco-editor').first().waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: production UI and API, local Monaco, fallback edit/submit/reload, demo isolation, profile reset.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
