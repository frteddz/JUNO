# JUNO - Milestones

Roadmap for JUNO, from first runnable skeleton to a distributable local assistant.

## M0 - Foundation (current)
- [x] Monorepo scaffold (workspaces, shared config, linting, formatting).
- [x] `@juno/core`: types, parser, dispatcher, config, SQLite store, events.
- [x] `@juno/automation`: timers, reminders, retry runner, cron basics.
- [x] `@juno/backend`: Fastify REST + WS server, auth helpers.
- [x] `@juno/cli`: natural-language + subcommands.
- [x] `@juno/tui`: Ink chat skeleton.
- [x] `@juno/plugins`: registry + manifest schema.
- [ ] First green CI run and passing unit/integration tests.

## M1 - Core flows end-to-end
- [ ] Natural-language command execution with streaming output in the TUI.
- [ ] Application & process management (launch, close, list).
- [ ] File operations (read, write, edit, rename, copy, move, delete, search).
- [ ] Timers & reminders firing with TUI notifications.
- [ ] System information command.

## M2 - Rich experience
- [ ] Full Markdown + Shiki code-block rendering in the TUI.
- [ ] Command palette, settings pages, theme switching (dark/light).
- [ ] Command history and session persistence in SQLite.
- [ ] Plugin loading from `~/.juno/plugins` and `juno plugin` subcommands.
- [ ] WebSocket event streaming from backend to TUI/CLI clients.

## M3 - Automation & integration
- [ ] Cron-based recurring tasks surfaced in the TUI.
- [ ] Workflow engine with confirm-before-destructive and rollback.
- [ ] Optional external integrations (weather, search, updates) behind env tokens.
- [ ] Notifications (terminal + optional OS-level).

## M4 - Distribution
- [ ] `npm i -g @euthenia/juno` stable release.
- [ ] Standalone single-file binaries for Linux, macOS, Windows.
- [ ] Signed releases + GitHub Releases with changelog.

## M5 - Documentation & polish
- [ ] Complete user guide, CLI reference, plugin dev guide, backend API reference.
- [ ] Accessibility pass (keyboard-first, high contrast, reduced motion).
- [ ] Performance pass on large histories and large file listings.