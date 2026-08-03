# JUNO - Progress

Live status of the JUNO build.

## Current state

- **Repository:** npm workspaces monorepo at project root.
- **Packages:** `core`, `cli`, `tui`, `backend`, `automation`, `plugins`.
- **Status:** M0 scaffolded; core flows implemented; tests + CI being finalized.

## Verified working
- Natural-language parser (open, close, read, list, search, timer, reminder, calc, sys info, help).
- Safe arithmetic calculator (shunting-yard, no eval).
- Cross-platform app launcher (Linux/macOS/Windows) and process kill.
- SQLite persistence via `node:sqlite` (sessions, messages, timers, reminders).
- Timers and reminders with persistence and event-bus notifications.
- Fastify local REST API with health, config, system, sessions, command endpoints.
- Commander CLI with natural-language and subcommand modes, `--json`.
- Ink TUI chat skeleton with markdown rendering and gold accent theme.
- Plugin registry with activate/deactivate lifecycle.
- Quality gate: `tsc --noEmit`, ESLint, Prettier, Vitest (21 tests), `tsup` build all pass.
- Local git history (main branch); GitHub push pending `gh` auth (gh CLI not installed on this machine).

## Completed (M0)
- Monorepo scaffold and shared tooling.
- All six packages build and typecheck cleanly.
- CI workflow added in `.github/workflows/ci.yml`.

## In progress
- Unit + integration tests across packages (Vitest).
- First passing CI run (GitHub Actions).
- End-to-end verification of CLI + TUI on this machine.

## Not started
- Shiki code-block highlighting in TUI.
- Command palette and settings pages.
- Plugin loading from user plugin directory.
- WebSocket event streaming wiring between backend and clients.
- Recurring cron workflows surfaced in the UI.
- Packaging into `@juno-cli/juno` and standalone binaries.

## Known issues / notes
- TUI uses `ink-markdown`; heavy Markdown documents may need paging later.
- `file.search` is capped at 2,000 visited entries.
- Timer durations longer than ~24.8 days exceed `setTimeout` limits and should use the scheduler.

_Updated: 2026-08-03._