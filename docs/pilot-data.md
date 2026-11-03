# Training pilot data dictionary

The pilot opens an SQLite database on first enrolment. The default location is `data/pilot.sqlite`. Set `PILOT_DB_PATH` to private persistent storage on the server. Keep the database, its WAL files, exports and backups outside Git, static hosting and shared folders. Use HTTPS (or localhost) and restrict filesystem access to the research operators. This implementation assumes one server with a persistent filesystem. In production the server also needs `src/data/problems.js` for canonical problem metadata.

## Consent and deletion

Joining on the personal dashboard registers consent version `pilot-v1`. A random browser credential authenticates writes. SQLite stores its hash and a separate random learner ID. The pilot does not collect names, email addresses, IP addresses, source code, compiler logs or pre-enrolment practice history. Ordinary code submission and optional AI coaching continue to use their respective external services. Demo mode sends no pilot data.

The familiarity question asks whether the learner has already seen the problem. Pre-existing attempts, hints or drafts mark a problem previously practised. A learner must explicitly select the explanation-sharing checkbox each time they choose to contribute a reflection; the text and selected quiz option are sent on evaluation only. Avoid identifying information in free text.

“Leave pilot and delete my data” stops collection immediately and removes that learner's database events and ratings. If disconnected, return to the dashboard and retry deletion. Keep the browser credential until deletion succeeds. Personal practice and the personal Reset button are independent of pilot enrolment. A downloaded export is a snapshot; before using it, regenerate it after withdrawals and dispose of obsolete copies.

## Export and review

Run from the repository root on the server holding the pilot database. Each export requires a new private destination and reads one consistent database snapshot.

```sh
npm run pilot -- export pilot-exports/run-001
npm run pilot -- export pilot-exports/review-001 --with-reflections
npm run pilot -- rate private-ratings.jsonl
```

Keep rating files in a private directory, outside the repository. Use reviewer aliases. Each rating JSON line contains `learner`, `reflectionId`, `reviewer`, `role` and `label`. The two IDs come from the restricted export. Acceptable roles are `independent` and `adjudicated`. Labels are `insufficient`, `partial` and `sound`. Give two reviewers separate unlabelled copies for independent review; import both ratings before adjudication. Re-importing the same review updates it. A bad row cancels the entire import. Re-export to pick up saved ratings.

| Export | Contents |
| --- | --- |
| `first-attempts.jsonl` | One eligible row per learner/problem. Inputs are topic, difficulty, priorTopicAttempts, priorTopicSuccessRate, priorTopicHelpViews and msSinceTopicAttempt. Missing rates and time gaps are null. IDs, split, judge version and timestamp are audit metadata. |
| `practice-events.jsonl` | Pseudonymous events in SQLite sequence order, including individual hints, observed coach help, exposures, manual practice and server submissions/verdicts. Post-exposure fields are available for auditing and must not be used as prediction inputs for that exposure. |
| `recommendations.jsonl` | Visible or activated dashboard, solver or roadmap recommendations, candidate IDs at that rule, selected problem, reason, rule version, time, surface and whether that exposure led to an open or attempt. Opening the same problem independently does not count as following that recommendation. |
| `review-outcomes.jsonl` | Self-reported recall outcomes for later analysis, separate from automated C++ verdicts. |
| `split-manifest.jsonl` | One pseudonymous learner per line. A fixed salted hash bucket assigns train/validation/test at approximately 70/15/15. A learner's assignment stays fixed between exports. |
| `summary.json` | Dataset version, participants, row and class counts by topic, counts by difficulty, split sizes, verdict totals and counts by exclusion reason. Empty or sparse groups need more pilot activity. |
| `restricted-explanations.jsonl` | Optional only. Includes explicitly shared approach text, quiz option (zero-based or null), prompt/rubric versions and human ratings. No reflection text appears in a default export. |

## Label and time conventions

The first eligible server-judged C++ submission on the first problem opening defines the label. An accepted first try with no observed help earns 1. A judged failure or an accepted first try after help earns 0. Built-in hints, visible coach guidance, quiz feedback and revision hint reveals are help. This represents help observed inside this app. External help is unobserved.

Features replay prior pilot events in server receipt order and freeze at first open. They use earlier completed judge results and help for that topic only. Times are server UTC Unix milliseconds. Each page visit has a session UUID. A stable event ID makes retries idempotent. A server submission ID links the start to its verdict; client-reported verdicts are rejected. Missing event acknowledgements conservatively mark history incomplete.

A problem with no judged attempt, only manual attempts, only provider errors, an unresolved earlier submission, missing history, an earlier visit/practice, or unknown familiarity is excluded. A confirmed service outage alone creates no training row. A later valid retry on the same initial exposure can qualify. Exclusion counts cover learner/problem pairs with recorded opens. Recommendation-only impressions and recall-only records remain in their own exports. No labels or learner observations are seeded by setup.
