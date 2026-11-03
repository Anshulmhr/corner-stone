// Operator-only CLI. No HTTP endpoint exposes the dataset or reviewer labels.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import store from '../server/pilot/store.js';
import data from '../server/pilot/dataset.js';

const [action, arg, option] = process.argv.slice(2);
const root = fileURLToPath(new URL('../', import.meta.url));
if (!fs.existsSync(store.defaultPath()))
  throw Error('No pilot database. An opted-in learner must enrol first.');
const db = store.openStore();
try {
  if (action === 'export' && arg && (!option || option === '--with-reflections')) {
    const out = path.resolve(arg);
    for (const name of ['public', 'dist']) {
      const web = path.resolve(root, name);
      if (out === web || out.startsWith(web + path.sep)) throw Error('Choose a private export directory.');
    }
    if (fs.existsSync(out)) throw Error('Choose a new output directory to preserve earlier snapshots.');
    db.exec('BEGIN');
    const snapshot = data.dataset(db, Boolean(option));
    db.exec('COMMIT');
    fs.mkdirSync(path.dirname(out), { recursive: true, mode: 0o700 });
    const tmp = fs.mkdtempSync(out + '.partial-');
    try {
      const files = {
        'first-attempts': snapshot.examples,
        'practice-events': snapshot.observations,
        recommendations: snapshot.recommendations,
        'review-outcomes': snapshot.reviews,
        'split-manifest': snapshot.learners,
      };
      if (option) files['restricted-explanations'] = snapshot.explanations;
      for (const [name, rows] of Object.entries(files)) {
        fs.writeFileSync(
          path.join(tmp, name + '.jsonl'),
          rows.map((r) => JSON.stringify(r) + '\n').join(''),
          { mode: 0o600 }
        );
      }
      fs.writeFileSync(path.join(tmp, 'summary.json'), JSON.stringify(snapshot.summary, null, 2) + '\n', {
        mode: 0o600,
      });
      fs.copyFileSync(path.join(root, 'docs/pilot-data.md'), path.join(tmp, 'DATA-DICTIONARY.md'));
      fs.renameSync(tmp, out);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    console.log('Exported', snapshot.examples.length, 'first-attempt rows to', out);
  } else if (action === 'rate' && arg && !option) {
    // One JSON object per line. Validate the whole batch in a single transaction.
    const rows = fs
      .readFileSync(arg, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    db.exec('BEGIN IMMEDIATE');
    for (const r of rows) {
      if (
        !store.uuid(r.reflectionId) ||
        !store.uuid(r.learner) ||
        !/^[a-zA-Z0-9_-]{1,40}$/.test(r.reviewer || '') ||
        !['independent', 'adjudicated'].includes(r.role) ||
        !['insufficient', 'partial', 'sound'].includes(r.label)
      )
        throw Error('Invalid rating');
      const e = db
        .prepare("SELECT seq FROM events WHERE learner=? AND id=? AND kind='reflection'")
        .get(r.learner, r.reflectionId);
      if (!e) throw Error('Unknown or withdrawn reflection');
      if (
        r.role === 'adjudicated' &&
        db.prepare("SELECT count(*) AS n FROM ratings WHERE event_seq=? AND role='independent'").get(e.seq)
          .n < 2
      )
        throw Error('Two independent reviews are required before adjudication');
      db.prepare(
        'INSERT INTO ratings VALUES(?,?,?,?) ON CONFLICT(event_seq,reviewer,role) DO UPDATE SET label=excluded.label'
      ).run(e.seq, r.reviewer, r.role, r.label);
    }
    db.exec('COMMIT');
    console.log('Saved', rows.length, 'ratings.');
  } else
    throw Error('Usage: npm run pilot -- export NEW_DIRECTORY [--with-reflections] | rate RATINGS.jsonl');
} finally {
  db.close();
}
