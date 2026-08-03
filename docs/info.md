# JUNO - Info

## What JUNO stands for

**JUNO** = **J**ust **U**nderstands **N**atural **O**rders.

JUNO is a **local-first** assistant that understands natural language and executes tasks
on your computer through a modern terminal interface. It runs fully offline with a deterministic
parser, or answers with optional DeepSeek AI.

## One-sentence problem statement

> JUNO provides a fast, natural-language command interface for interacting with your computer
> through a modern terminal.

## Product model

- **Unified product.** A single JUNO system: CLI + Terminal UI + local backend + automation engine
  all serving one goal.
- **Local-first.** Config, history, plugins, and user data live locally. Works fully offline for
  core functionality. External services (weather, search, updates, plugins) are optional and only
  contacted when the user requests them.
- **Not a public cloud API.** The backend is a local HTTP/WebSocket API for internal integrations.

---

## Design decisions (from project intake)

### Scope
- Repo layout: **npm workspaces monorepo** (`packages/{core,cli,tui,backend,automation,plugins}`).
- Package manager: **npm**. Bundler: **tsup**. Tests: **Vitest**.

### TypeScript / runtime
- Language: **TypeScript 5**, runtime: **Node.js 24+**.
- Modules: ESM (`"type": "module"`, `NodeNext`).

### Backend
- Framing: **Fastify** (REST/JSON) + **ws** (WebSocket streaming/events).
- Validation: **Zod**.
- Persistence: **SQLite** (configuration, chat history, plugins, user data).
- Auth: **simple local token** for local socket/HTTP clients.

### Terminal UI
- **React 19 + Ink 6** TUI (cross-platform: Linux, macOS, Windows; also works over SSH/WSL).
- Rendering: **react-markdown** / **ink-markdown**, **Shiki** syntax highlighting, Yoga layout via Ink.
- State: **Zustand**. Colors: **Chalk/Yoctocolors**.

### CLI
- **Commander.js**, hybrid command structure (natural-language + subcommands).
- POSIX exit codes, `--help`, colored output, `--json` output, suggestions, confirm-before-destructive.

### Automation
- Native Node.js: `child_process`, `fs/promises`, `timers/promises`, `EventEmitter`, cron scheduler.
- Retry with exponential backoff; do **not** retry permanent failures; rollback where possible.

### Design language
- Accent: **modern gold (#d4af37)**. Background: **starry galaxy** (dark default) with light theme.
- Typography: **Inter** for UI text, **JetBrains Mono** for code.

### Quality / release
- Build: `tsc --noEmit`, ESLint 9, Prettier, Husky + lint-staged, GitHub Actions CI.
- Install: `npm install` (dev), `npm i -g @euthenia/juno` (planned), standalone binaries.

### Distribution & licensing
- Public repo for visibility, but all rights reserved (UNLICENSED). See [LICENSE.md](../LICENSE.md).

## Status
See **[progress.md](progress.md)** for current build state and **[milestone.md](milestone.md)** for the roadmap.