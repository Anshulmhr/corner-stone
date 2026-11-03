// Separate processes keep each suite's browser storage and fetch fixtures isolated.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
delete env.GEMINI_API_KEY;
delete env.OPENAI_API_KEY;

const commands = [
  ['node_modules/vite/bin/vite.js', 'build'],
  ['test_bundle_scan.cjs'],
  ...['adaptive_engine', 'recommendation_system', 'revision_system', 'roadmap_engine',
    'blind_solve', 'mistake_patterns', 'intelligence_engine', 'phase2b_integration']
    .map(name => [`test_${name}.js`]),
  ['test_ai_coach.cjs'],
  ['--test', 'test_grading_outcomes.mjs'],
  ['test_grading_local.cjs'],
  ['tests/stability-browser.mjs'],
];

for (const args of commands) {
  console.log('\nRunning', args.join(' '));
  const run = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  if (run.error) throw run.error;
  if (run.status !== 0) process.exit(run.status ?? 1);
}
