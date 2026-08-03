# App Dev — Build Prompt

Goal: plan and build a mobile or desktop application (iOS, Android, cross-platform, or desktop — scope in intake). Clean architecture, working baseline, sensible defaults. Never pretend a feature works without code proving it.

## 0 · INTAKE — ask before you build
Ask one batch at a time. Wait for answers. Never invent real-looking credentials, API keys, or URLs. Missing → demo defaults.

**Batch A — product (required)**
1. App name (or placeholder)
2. Category / core problem it solves, in one plain sentence
3. Target platform (iOS, Android, both, desktop)
4. Tech stack preference (Swift, Kotlin, Flutter, React Native, Electron, Tauri) or "you choose"
5. Core feature list (2–5 features to actually ship)
6. Does it need a backend / API / local storage, or offline-first?

**Batch B — UX & design**
1. Vibe/theme (minimal, playful, enterprise, dark)
2. Primary accent + background tone
3. Real user flows to cover on first build

**Batch C — data & models**
1. What data lives in the app? Entities and fields
2. Local persistence (SQLite, local files) vs remote (API)
3. Any auth/accounts?

**Batch D — technical & deploy**
1. Build tooling / target SDK versions
2. Deploy/distribution (app store, sideload, plain executable)
3. Existing repo or fresh start

## Rules
- No invented API keys or secrets — use env vars with placeholders.
- Build an MVP that actually runs; stubs are labeled.
- State the verification command (build/run/test).