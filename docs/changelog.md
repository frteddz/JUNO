# JUNO - Changelog

All notable changes to JUNO are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and JUNO uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

JUNO is not open source. See the [LICENSE](../LICENSE.md).

## [Unreleased]

### Added
- Monorepo scaffold (npm workspaces: `core`, `cli`, `tui`, `backend`, `automation`, `plugins`).
- `@juno/core`
  - Natural-language command parser (`open`, `close`, `file read/write/list/search`, `timer`, `reminder`, `calc`, `sys.info`, `help`).
  - Intent schema (Zod) and dispatcher for local actions.
  - Config management (JSON + env vars) and SQLite store (`node:sqlite`).
  - Event bus, system info, file utilities, safe calculator, cross-platform app launcher.
- `@juno/automation`
  - Timers and reminders with persistence and `timer.fired` / `reminder.fired` events.
  - Workflow runner with exponential-backoff retry and permanent-error detection.
  - Minimal cron parser (`* * * * *`) and matching.
- `@juno/backend`
  - Fastify REST API: `/health`, `/api/config`, `/api/system`, `/api/sessions`, `/api/command`.
  - Local token auth helpers (`generateToken`, `verifyToken`).
- `@juno/cli`
  - Commander-based CLI: `juno "natural language"`, `juno say <text>`, `juno open`, `juno close`,
    `juno read`, `juno timer`, `juno info`, `juno config get/set`, `--json` output.
- `@juno/plugins`
  - Plugin manifest schema and registry with activate/deactivate lifecycle.
- `@juno/tui`
  - Ink-based chat interface (header, message list, markdown rendering, input bar).
- Documentation: `docs/` site, `README.md`, intake record `docs/info.md`.
- CI workflow (build, lint, typecheck, test) in `.github/workflows/ci.yml`.

## [0.0.0] - 2026-08-03
- Project inception. Intake completed across six domains.