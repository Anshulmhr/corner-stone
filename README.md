# Corner Stone · AdaptiveDSA

AdaptiveDSA is a browser-based DSA practice app with a C++ judge, progressive hints, Blind Solve challenges, spaced revision and rule-based recommendations. JavaScript practice supports self-reported completion. The coach supplies rule-based guidance by default and can use a configured external AI provider.

## Run locally

Install Git and Node.js 24 with npm. From PowerShell, Terminal or a shell:

```sh
git clone https://github.com/Anshulmhr/corner-stone.git
cd corner-stone
npm ci
npm run dev
```

Open [the development app](http://localhost:5173). The command starts both Vite and Express. Vite forwards requests under `/api` to the API at port 3001. Keep that port for the default development proxy. Stop both processes with Ctrl+C.

The app works without a coach API key. To enable a provider, copy `.env.example` to `.env` in the repository root, set the applicable key, and restart. On Windows use `Copy-Item .env.example .env`. The server reads `.env`; these keys stay on the server.

## Personal and demo practice

Personal practice uses this browser’s local storage for the app’s origin. Existing attempts, drafts and scores use their original keys. Select **Demo Data** in the sidebar or **Open demo profile** in Progress to enter a sample profile. A banner and **Return to my progress** identify demo mode. The demo uses tab session storage, survives a reload, and can be opened directly at `/?profile=demo`.

**Reset** asks for confirmation and clears the active profile’s solves, attempts, hints, code drafts, revision schedule, reflections, assessments and active Blind Solve sessions. Resetting the demo leaves it empty for the rest of that tab session. Personal progress and data belonging to other apps are separate.

The solver provides an editable plain-text field while the locally bundled Monaco editor loads. If the editor assets are unavailable, use the same field to edit, save and submit. Your draft stays with its problem and language. C++ submissions still require the API and its external Wandbox compiler. A compiler outage is reported as an ungraded retry. Manual practice remains available.

## Run the production build

```sh
npm ci
npm run build
npm start
```

Open [the built app](http://127.0.0.1:3001) or [API health](http://127.0.0.1:3001/api/health). Express serves both the generated `dist/` assets and `/api/*`. The default host is `127.0.0.1` and the default port is `3001`. For a container, set `HOST=0.0.0.0` and the host platform’s `PORT` in its environment.

For hosts with separate build and run steps, build with development dependencies first. Include `dist/`, `server/`, `shared/` and the package manifests in the runtime. Install runtime dependencies with `npm ci --omit=dev` and use `npm start`. Rebuild after frontend changes.

## Automated verification

Install a C++17 compiler available as `g++` (MinGW-w64 on Windows), or set `CXX` to the compiler executable. From the repository root:

```sh
npm ci
npx playwright install chromium
npm test
```

On a fresh Linux runner use `npx playwright install --with-deps chromium`. To run against an existing Chromium installation, set `CHROMIUM_PATH` to its executable. Installing packages and Chromium requires network access. After installation the default suite builds and tests locally without sending submissions to Wandbox or invoking an AI provider.

| Command | Coverage |
| --- | --- |
| `npm test` | Production build and bundle scan, learning and coach suites, grading, and a Chromium learner flow. The browser test starts Express on a free loopback port and checks API health. |
| `npm run test:grading` | All 20 C++ reference solutions, deliberately incorrect solutions, API responses and stored score regressions. Local compilation is limited to fixed test fixtures. |
| `npm run build` then `npm run test:browser` | Catalogue navigation, blocked-editor-asset editing and submission with a fixture response, persisted drafts, personal/demo separation and profile-specific reset. |
| `npm run test:live` | Optional existing integration audit. Start `npm run server` on port 3001 in another terminal. This sends fixture C++ source to Wandbox and depends on the provider’s availability. |

The GitHub Actions **Test** workflow runs `npm test` on pushes and pull requests. It also supports manual dispatch. The live-provider audit is a separate, opt-in command.

## Source map

| Location | Purpose |
| --- | --- |
| `src/data/` | Curriculum and public examples |
| `src/services/` | Learning rules, progress, revisions and active practice profile |
| `src/components/Solver/` | Editor, submissions and feedback |
| `server/` | Express API, private test harnesses and coach |
| `shared/compiler.json` | Compiler selection and display label used by the API and UI |
| `scripts/test.mjs`, `tests/` | Local test runner and browser regression |
