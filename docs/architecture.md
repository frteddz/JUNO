# JUNO - Architecture

JUNO is a local-first command assistant written entirely in TypeScript. It is organized as an
npm workspaces monorepo.

## High-level flow

```text
┌──────────────────────────────────────────────────────────────┐
│  TUI (Ink/React)    ──►   @juno/core (parser + dispatcher)   │
│  CLI (Commander)    ──►         │                            │
│                            ┌────▼─────────────────────────┐  │
│                            │ Actions (apps, files, calc,  │  │
│                            │ sys, timers, reminders)      │  │
│                            └────┬─────────────────────────┘  │
│                                 │ EventBus                   │
│            ┌────────────────────▼───────────┐                │
│            │ @juno/automation (scheduler,   │                │
│            │  workflows, retry, cron)       │                │
│            └────────────────────────────────┘                │
│            @juno/backend  → local REST/WS API (optional)     │
│            @juno/plugins  → registry + lifecycle              │
│            SQLite (node:sqlite) ← persistence                 │
└──────────────────────────────────────────────────────────────┘
```

## Packages

| Package | Responsibility |
| --- | --- |
| `@juno/core` | Shared: types, NL parser, dispatcher, config, SQLite store, event bus, system info, actions |
| `@juno/cli` | Commander entrypoint; natural-language + subcommands; `juno` binary |
| `@juno/tui` | React + Ink terminal interface |
| `@juno/backend` | Local Fastify REST + WebSocket API, auth, notifications |
| `@juno/automation` | Timers, reminders, workflow runner, retry, cron scheduler |
| `@juno/plugins` | Plugin manifest schema, registry, lifecycle |

## Key design decisions

### Types & validation
- Shared types live in `@juno/core`.
- All user input is validated with **Zod** (`IntentSchema`).

### Persistence
- **SQLite** via `node:sqlite` (no native build step). Tables: `sessions`, `messages`, `timers`,
  `reminders`.

### Communication
- An in-process **EventBus** decouples the TUI/CLI from the automation engine and backend.
- The backend exposes a local HTTP API (`/api/command`, `/api/sessions`, etc.) and WebSocket for
  event streaming and integrations. Client authentication uses a local token.

### Local-first & offline
- Core functionality works fully offline.
- Optional integrations (weather, search, updates) are only reached when requested, using env
  placeholders (never committed secrets).

## Tooling
- Build: **tsup**. Runtime: **tsx** (dev) / Node.js 24.
- Type check: `tsc --noEmit`. Lint: **ESLint 9** + Prettier. Tests: **Vitest**.
- Hooks: **Husky** + **lint-staged**. CI: GitHub Actions.