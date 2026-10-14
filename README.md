# Forge — Coding Academy

A beginner-first coding academy built around **writing, executing, testing, and understanding actual code**. This repository implements the foundation and a working beginner vertical slice of the much larger requested learning platform. It is not a claim that all advanced courses or production sandbox infrastructure are finished.

## Installer downloads

Installers are currently available in the private repository's [`releases` folder on the working branch](https://github.com/NIXXIOnCrac/dev-learning/tree/arena/a74086e4-dev-learning/releases). Sign into GitHub with repository access before downloading. The temporary Arena/E2B preview URLs require platform authentication and are **not public download links**.

The three installers were deliberately committed as a delivery exception because this workspace could push Git objects but could not upload GitHub Release assets. Their remote Git blob hashes and byte sizes were checked against the local builds. `releases/` remains ignored for future generated files; do not routinely add new binary versions to Git. Move future downloads to a release-asset host when uploading is available.

macOS packages are available separately for Apple Silicon and Intel. They require macOS 11+ and administrator approval to install into `/Applications`. Launch **Forge Coding Academy** to open the local browser app; launch **Stop Forge** before updating or removing it. Progress lives in `~/Library/Application Support/ForgeAcademy/` and is preserved on removal. Both packages are unsigned and not notarized; **native Mac installation and Finder launch remain untested**. Package structure, payload checksums, architecture, and the application running with Linux Node were checked. Build with `npm run build:macos` and check the packaged applications with `npm run verify:macos` after building the frontend.

## Windows installer

**Windows installer 1.0.1** fixes the version gate that incorrectly rejected a Windows 11 machine. It uses `ntdll!RtlGetVersion`, accepts native major versions 10 and later, and still requires a 64-bit system. The old 1.0.0 Windows download has been removed from the current download folder. Native Windows installation still needs verification.

The local Windows 10/11 x64 edition is packaged as **Forge-Academy-1.0.1-win-x64-Setup.exe** (under ignored `releases/`). It installs for the current user without elevation, bundles Node and every current coding runtime, and launches the academy in the default browser. It is not an Electron/native-window app. No separate Python, Node, Docker, or internet download is required for the included lessons.

- **Launch:** Start menu → Forge Coding Academy.
- **Stop:** Start menu → Forge Coding Academy → Stop Forge. Closing the browser does not stop the server.
- **Local address:** `http://127.0.0.1:33791`, loopback-only; an authenticated loopback management endpoint uses port 33792.
- **Progress:** `%LOCALAPPDATA%\ForgeAcademy\academy.db`. Uninstall preserves this folder. Preview progress is not automatically imported. Use a local account to recover the identity if browser cookies are cleared.
- **Remove:** Windows Settings → Apps → Forge Coding Academy.
- **Signature:** unsigned; an unknown-publisher/SmartScreen warning may occur. Check `releases/SHA256SUMS.txt`; do not disable security protections. Windows Script Host is used for the shortcuts.

Build on this Linux workspace after installing dependencies and building the frontend:

```sh
npm run build
npm run build:windows
npm run verify:windows
```

The build fetches a pinned NSIS compiler Git blob from GitHub and a pinned Windows Node package from npm, uses a separate locked minimal backend dependency set, and never bundles learner databases, cookies, credentials, or development environments. The smoke check runs the **packaged payload** with Linux Node and Chromium, verifies all four coding runtimes (including all JavaScript solutions), and rejects external browser requests. Launcher tests cover single-instance reuse, authenticated stop, clean SQLite shutdown, and persistence through restart.

**Not yet verified on Windows:** the executable installation wizard, native Node binary, Start menu/desktop shortcuts, default-browser handoff, and Windows uninstallation. The installer compiles successfully and its PE structures are checked, but that does not replace a real Windows test. See `packaging/windows/INSTALLATION.txt` for user-facing notes.

## Run it

**Node.js 22.13+** is required (the local database uses `node:sqlite`).

```sh
npm install
npm run dev
```

Open port **3000**. The server binds to `0.0.0.0`; the Vite middleware accepts proxied preview hosts. All browser API, worker, and runtime URLs are relative—there are no browser-facing localhost dependencies or public-CDN runtime downloads.

```sh
npm run build       # build the web app
npm start           # serve the production build on port 3000
npm test            # curriculum / prerequisite checks
npm run test:e2e    # real Chromium browser tests, including actual runtimes
```

React hot-reloads in development. Restart the process after changing backend code or environment variables.

## What works today

### Two complete beginner courses

Ten Python lessons, in a deliberate prerequisite order:

1. Output and strings
2. Variables and data types
3. Numbers and operators
4. Functions, parameters, and return values
5. Conditionals and boundaries
6. Loops, lists, and accumulators
7. String methods and normalization
8. Dictionaries, defaults, and records
9. JSON, imports, booleans/null conversion, and filtering
10. Specific exceptions, integer conversion, and validation

Eight JavaScript lessons form a separate, independently startable track:

1. Console output, strings, and exact syntax
2. `const`/`let`, numeric types, and arithmetic
3. Functions, parameters, and returning instead of logging
4. Conditions, comparisons, and boundary cases
5. Objects, arrays, and missing-versus-zero defaults
6. `for…of`, accumulation, and returning after the loop
7. JSON parsing, arrays, and `try`/`catch`
8. Promises, `async`/`await`, and rejection handling

The JavaScript course teaches the language inside a worker, not DOM manipulation or live API calls. Its async exercise uses real supplied loader functions and delayed promises without enabling network access. The parcel-checkout challenge combines collection traversal, filtering, and aggregation.

Each lesson contains a plain-English explanation, real syntax, symbol-by-symbol breakdowns, an editable example, output-prediction question, independent task, executable tests, four-step hint ladder, and explicitly requested worked solution. The arithmetic and looping exercises additionally check for the requested syntax using Python's AST or TypeScript's JavaScript parser. These are teaching checks, not anti-cheat guarantees.

A correct submission unlocks the next lesson and grants XP **once**. Clicking a lesson, running sample code, viewing hints, or revealing a solution grants no XP. Original greeting, list-summation, parcel-checkout, and inventory-capstone challenges include examples, constraints, visible and hidden-from-the-UI edge cases, runtime measurements, and post-completion complexity explanations.

### Real workspaces

- Locally bundled Monaco editor with highlighting, Python snippets, and JavaScript/TypeScript language services.
- Real **Python (Pyodide / CPython WebAssembly), JavaScript, TypeScript, and SQL (SQLite WebAssembly)** execution.
- JavaScript/TypeScript supports top-level `await` in the practice runner. Assertions are awaited and caught separately, so one failing or rejected assertion does not hide other results. Test-invocation logging is excluded from the learner’s console. An unsettled promise is terminated by the same execution deadline as an infinite loop.
- TypeScript is transpiled before execution; this is not a type-checked exam grader.
- Console output, execution errors, line markers, run and submit controls, reset confirmation, attempt history, and restore.
- **Trace code** records actual synchronous Python execution with `sys.settrace`, then lets you step backward/forward through line events, local-variable snapshots, and return values. The editor highlights the corresponding line. This is recorded replay, **not live breakpoints**; it does not advance XP or retention. Editing the code invalidates the trace. Traces are limited to 160 events, 20 simple local variables per event, and abbreviated representations; imported modules are not traced. Normal execution timeouts still apply.
- Error coaching explains common Python and JavaScript exceptions with a concrete investigation step, without writing the solution. The original traceback remains available.
- All eight JavaScript lessons and the four extended Python data lessons include intentionally broken **Debug mode** programs covering lost method results, zero-versus-missing defaults, premature returns, and a conversion outside the protected block.
- Run with `Ctrl/Cmd + Enter`; search with `Ctrl/Cmd + K`.
- Learn, practice, challenge, debug, build, and untimed exam workflows. Exam mode starts blank and disables hints, the tutor, snippets, previous-attempt restoration, and the worked walkthrough.
- Multi-file portfolio and Python-calculator project editors. Python modules can import other `.py` files in the project.
- Sandboxed HTML/CSS/JavaScript preview bundles `index.html`, `style.css`, and `script.js`; refresh explicitly after editing. Extra files can be saved and downloaded individually, but are not resolved as an arbitrary website filesystem.
- Export the current portfolio as one self-contained HTML file, the calculator as a Python text export, or individual source files.
- Lesson/project drafts autosave to the backend, with a keepalive flush when leaving. Playground drafts are stored only in the current browser.

### Progress with useful feedback

- XP, levels, eight derived achievements, daily quests, non-punitive learning-day tracking, progress bars, celebration animation, and opt-in success sounds.
- Course-aware prerequisites, saved active-course preference, language-specific editor/exam syntax, per-course counts and foundation badges, challenge language filters, and a course-completion transition. JavaScript progress never grants Python foundation badges. Existing Python progress and first-six-lesson badge thresholds are preserved.
- Concept-level attempts, successful submissions, practice time, last errors, and hint use.
- Personal weekly activity chart and a dedicated **Review queue** with ready, upcoming, and all-concept views.
- Server-persisted review scheduling: first independent recall, then 1 / 3 / 7 / 14 / 30 / 60-day intervals. Successful early repeats cannot skip stages; reading a page or a guided solution never advances recall.
- Failed submissions of previously learned concepts recommend a supported warm-up. Failed independent checks restart the short review cycle without removing XP. "Retained" requires three successful scheduled recall checks; this is a transparent practice heuristic, not an anti-cheat or mastery certification.
- Next-step recommendations prioritize recovery, then due recall, then the next unlocked lesson. Legacy profiles retain their XP, drafts, and original six-lesson foundation badge; old review dates are mapped to a one-day interval on read.
- No fabricated progress, public leaderboard, pretend memory readings, or XP for merely navigating.
- Responsive dark interface, reduced-motion support, keyboard navigation, modal focus trapping, and labeled controls.

### Backend and accounts

- Express API, persistent anonymous profiles, optional registration/sign-in, account-specific drafts, submissions, progress, settings, and tutor conversation history.
- Passwords use salted `scrypt`; the database stores hashed random session tokens, not raw cookies.
- HttpOnly session cookies, a 30-day expiry, same-origin mutation checks, input/body limits, and request/sign-in rate limiting.
- HTTPS requests use Secure, SameSite=None, partitioned cookies for iframe previews; plain HTTP development uses SameSite=Lax.
- SQLite with WAL by default; a PostgreSQL adapter is selected through `DATABASE_URL`.
- In-process per-user mutation queues prevent local autosave/reward races. **Run one API instance** until this is replaced with PostgreSQL row-level transactions or advisory locks.

### An honest tutor

Without an API key, **Guided mode** provides deterministic beginner explanations and lesson-specific conceptual hints. It is clearly labeled and does not pretend to be an LLM.

With a server-side OpenAI-compatible provider configured, the tutor sends the current lesson, task, learner code, and question to the provider. The prompt favors short explanations and progressive hints rather than automatic full solutions. Conversation messages are persisted; the current implementation sends the current question/context rather than the entire prior conversation or a full adaptive learner model.

Export environment variables before running the server:

```sh
export TUTOR_API_KEY='your-provider-key'
export TUTOR_BASE_URL='https://your-provider.example/v1'
export TUTOR_MODEL='your-model'
npm run dev
```

Keep keys in deployment secrets, never in `src/` or a `VITE_` environment variable. Provider availability, billing, and outbound host permissions are deployment responsibilities. No live provider was connected during implementation.

## Execution security: scope and limits

**Student code is never executed by Node, a child process, or an OS shell on the application server.**

`public/runner.js` runs on the learner's device in a disposable dedicated Web Worker:

- No document/DOM access.
- Independent worker CSP permits scripts and connections only under the same-origin `/runtime/` asset paths; it disallows API calls, external network access, and additional workers.
- Runtime initialization deadline: 45 seconds. Execution deadline after initialization: 5 seconds, enforced by terminating the worker from the UI.
- Output is capped at 500 entries of 4,000 characters each. Every run starts in a fresh runtime.
- Python has a disposable WebAssembly filesystem, not the server's filesystem.
- HTML previews use an opaque-origin `sandbox="allow-scripts"` iframe and a restrictive CSP: no external resource loading, forms, or parent-origin access.

**This is a personal browser practice runtime, not a hardened multi-tenant competitive sandbox.** The browser does not provide a guaranteed per-worker RAM or CPU quota; malicious allocations may exhaust a tab. Same-origin worker storage APIs are not a separate security origin. Iframe navigation is not a network-isolation boundary. Do not automatically execute code from untrusted third parties. Memory usage is deliberately not invented.

Tests and reference solutions are downloaded to the client. “Hidden” means omitted from the teaching UI, **not secret from developer tools**. The server validates exercise IDs, prerequisites, result shapes, and reward idempotency, but accepts client-reported results. Therefore personal XP is **not cryptographically verified** and must not be used for exams, prizes, or public rankings requiring anti-cheat guarantees.

Before offering public competitive grading, terminal access, arbitrary dependencies, or unrestricted multi-file builds, integrate an external managed executor with a separate security boundary (for example a provider offering microVM/gVisor isolation):

1. Queue the authenticated submission on the API server; never evaluate it there.
2. Send only code, allowlisted runtime identity, and server-owned test definitions to the executor.
3. Enforce hard memory, CPU, wall-time, process, disk, and output limits; deny outbound networking and privileged syscalls; use an unprivileged UID and a disposable filesystem.
4. Keep hidden tests and answer keys out of frontend content; return test summaries, not those source files.
5. Authenticate executor callbacks, match them to server-created submission IDs, and atomically award XP from trusted results.
6. Do not expose host sockets, secrets, cloud metadata, or the production database to the execution environment.

That external executor is an explicit next phase, **not a silently enabled unrestricted execution endpoint**.

## PostgreSQL / deployment

For a separately managed PostgreSQL instance:

```sh
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/forge'
export COOKIE_SECURE=true      # only behind HTTPS
npm run build
npm start
```

Alternatively, `compose.yml` defines the application and a health-checked PostgreSQL 16 service:

```sh
export POSTGRES_PASSWORD='use-a-unique-long-url-safe-password'
docker compose up --build
```

The compose database is not exposed on the host network. Put the app behind a TLS reverse proxy that preserves the original Host and sets `X-Forwarded-Proto: https`. Do not set `COOKIE_SECURE=true` when browsing plain HTTP locally. Set database TLS according to your provider's requirements.

SQLite lives in ignored `.data/academy.db`; back it up with a consistent SQLite backup operation, not an uncontrolled copy while writing. PostgreSQL uses the `academy-postgres` Docker volume; configure scheduled backups and restoration checks before production. Register an account to recover progress across browsers. Guest work is tied to a cookie; clearing that cookie loses access to the anonymous profile.

The PostgreSQL adapter and Docker deployment configuration are included, but this environment was tested with SQLite, not a live PostgreSQL or Docker service. Account recovery, email verification, OAuth, distributed rate limiting, schema-versioned migrations, data export/deletion, and multi-replica locking are not implemented. Treat this as a learning application, not a finished internet-scale identity system.

## Architecture

```text
src/
  App.jsx          navigation, dashboard, roadmap, challenges, accounts, insights, tutor
  Workspace.jsx    lazy-loaded Monaco, runner lifecycle, lessons, projects, playground
  content.js       curated course definitions, prerequisites, original challenges, roadmap
  curriculum/      extended Python/data lessons, JavaScript track, and original challenges
  learning.js      shared, pure review-scheduling and recommendation rules
  ReviewQueue.jsx  dedicated review queue and actionable next-step cards
  TraceViewer.jsx  real execution replay, variable inspection, and error coaching
  feedback.js      transparent language-aware error explanation rules
  ui.jsx           shared UI primitives, icons, illustration, accessible modal, API helper
  styles.css       responsive visual system and reduced-motion variants
server/
  index.js         sessions, account API, progress, submissions, conversations, runtime CSP
  db.js            common SQLite / PostgreSQL query adapter and initial schema
public/
  runner.js        actual disposable browser execution, output collection, test evaluation

tests/
  content.test.js  course completeness, prerequisite integrity, honest availability
  e2e/             actual-browser execution, security boundaries, progress and UI flows
```

Lesson schema: explanation → symbol breakdown → prediction → independent code → executable tests → hints → reflection. Course IDs and prerequisites separate curriculum from the UI. To add a new available lesson, supply the complete teaching content and real tests, include it in its ordered course list in `courses` (the Python list uses `lessonOrder`), and extend the execution and regression tests. Future curricula should be split into versioned modules and, for secure grading, separate public teaching content from private test/solution content.

## Remaining roadmap

Fifteen visible chapters cover the requested long-term direction: Python, developer tools, web fundamentals, JavaScript, TypeScript/React, SQL, backends, full-stack systems, security/testing, deployment, desktop/mobile, AI engineering, CS/algorithms, product/software design, and advanced systems. Python foundations and JavaScript foundations are currently available as complete beginner courses. Browser DOM, modules, Fetch, and deeper JavaScript topics remain future work. The roadmap's future course counts/durations are editorial planning estimates, not available lesson inventory.

Planned work includes advanced curricula, more original problems at every difficulty, graduated independent projects, code-explanation grading, more adaptive prerequisite models and varied recall tasks, weekly quests, additional boss assessments, opt-in verified leaderboards, recoverable streaks, unlockable themes, live debugger breakpoints and multi-file/async tracing, a sandbox terminal, GitHub project integration, API/database project testing, mobile/desktop builds, and the hardened executor described above.

## Verification

The Playwright suite uses a Chromium binary distributed through npm, so it does not require an external browser-download CDN in restricted environments. The bundled test setup targets Linux x64 and extracts missing NSS libraries under ignored `.cache/`; regular Playwright browser installation can be substituted on other platforms. Tests launch Chrome with its OS sandbox disabled for this container, **but do not disable browser web security or CSP**.

The tests cover real reference-solution execution, failing/syntax-error code, JavaScript/TypeScript/SQL, network-denial CSP, a terminated infinite loop followed by successful execution, grading and one-time XP, saved drafts/reloads, multi-file preview/export, guest-to-account persistence, user isolation, prerequisite enforcement, concurrent reward idempotency, exam restrictions, review persistence, mobile layout/navigation, settings, and the guided tutor.

## Second increment: data fluency, recall, and debugging

The Python path now leads into a **Supply Station boss battle**: parse incoming JSON, handle invalid/negative quantity strings, aggregate repeated item names, and return a dictionary. Six real tests cover normal cases and edge cases. The challenge unlocks after the error-handling lesson and grants 300 XP once; its badge is separate from course completion.

Review state is stored inside each learner's existing state document under `reviewSchedule`. `GET /api/recommendations` returns the same transparent recommendations and review queue shown in the interface. Only graded submissions mutate the schedule; the old `PATCH /api/state` review shortcut no longer marks anything complete. Like all browser-graded exercises here, independent-check results are not tamper-proof.

Additional verification covers all ten Python reference solutions and the capstone through the runtime and submission API, flawed debugging examples, bounded/accurate execution traces, stale trace invalidation, editor decorations, no-XP tracing, review persistence, early-repeat protection, recovery recommendations, legacy profiles, and error explanations. Scheduling tests use an injected clock rather than waiting days.

## Third increment: independent JavaScript foundations

The shared course definitions are the source of truth for per-course lesson counts, explicit prerequisites, recommendations, and achievements. Both first lessons have no prerequisites. A saved `activeCourse` preference controls the next unfinished lesson; due reviews and recovery tasks still take priority in review recommendations. Completing JavaScript offers Python or recall practice rather than looping back to a completed lesson.

JavaScript earns 900 course XP and a separate eight-lesson badge. The parcel-checkout challenge unlocks after JavaScript loops and grants 200 XP once. Independent assessments reuse the same review scheduler with distinct lesson IDs. They start with a valid JavaScript comment and disable all Monaco suggestion categories.

New browser coverage exercises every JavaScript reference solution and broken debugging program, source-syntax checks, independent prerequisites/rewards, language-filtered challenges, no cross-language badges, Monaco editing/autosave/reload, independent recall, async assertion isolation, delayed promises and rejections, network denial, pending-promise termination/recovery, language-aware error coaching/tutoring, and the course-finish transition. Python, TypeScript, SQL, projects, and existing account/review flows remain in the regression suite.
