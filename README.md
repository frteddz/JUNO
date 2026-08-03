<div align="center">

# JUNO

**J**ust **U**nderstands **N**atural **O**rders

_A local-first, non-AI command-line assistant that understands natural language and runs tasks
on your computer — right from the terminal._

[![CI](https://img.shields.io/github/actions/workflow/status/frteddz/JUNO/ci.yml?branch=main&label=CI&logo=github)](https://github.com/frteddz/JUNO/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Proprietary-999999.svg)](#license)

</div>

---

JUNO takes a plain-English command, figures out what you want, and does it: open apps, read and
search files, set timers and reminders, show system info, and crunch numbers — **with no AI, no
cloud, and no API keys.** It's fast, offline-first, and built entirely in TypeScript.

> **Notice:** JUNO is **proprietary software**, not open source. See [LICENSE](LICENSE.md).

## Requirements

- **Node.js 24+** (uses the built-in `node:sqlite`)
- **npm 11+** (included with Node)
- Linux, macOS, or Windows (any ANSI-compatible terminal; works over SSH/WSL)

Check your version:

```bash
node --version
```

## Try it

```bash
# clone & install
git clone https://github.com/frteddz/JUNO.git
cd JUNO
npm install

# one-shot command
npm run dev -- "open firefox"

# interactive terminal interface
npm run dev -- --run
```

> To use the bare `juno` command from this repo (instead of `npm run dev -- "…"`), link it once:
> ```bash
> cd JUNO/packages/cli && npm link
> ```
> or install globally with `npm install -g .`. All examples below assume `juno` is on your PATH.

## Available without an AI

JUNO does **not** require an AI provider or API key. It uses a deterministic command parser, so
it works entirely offline out of the box.

```bash
juno "open firefox"
juno "close firefox"
juno "set a timer for 30 minutes"
juno "remind me in 10 minutes to take a break"
juno "read ~/Projects/JUNO/README.md"
juno "list files in ~/Projects"
juno "show system info"
juno "what is 12 * 8 + 3?"
```

You can also use classic subcommands:

```bash
juno open firefox
juno close firefox
juno read <path>
juno timer 30m          # also 90s, 1h
juno info
juno config get theme
juno config set theme light
juno say "set a timer for 5 minutes"
```

Add `--json` for structured output in scripts:

```bash
juno info --json
juno read package.json --json
```

## Installation options

| Method | Command |
| --- | --- |
| **From source (dev)** | `git clone …` + `npm install` |
| **Global npm (stable)** | `npm install -g @juno-cli/juno` <sup>1</sup> |
| **Standalone binaries** | Linux / macOS / Windows executable <sup>2</sup> |

<sup>1</sup> Published under the `@juno-cli` scope. <br>
<sup>2</sup> On the roadmap — see [Milestones](docs/milestone.md).

After a global install, run it anywhere:

```bash
juno "open firefox"
juno --run
```

## Development

```bash
npm install
npm run build        # tsup build all packages
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint + Prettier
npm test             # Vitest
```

Husky + lint-staged run automatically on commit.

## Project structure

```text
JUNO/
├── packages/
│   ├── core/        # Types, natural-language parser, dispatcher, SQLite store, event bus
│   ├── cli/         # Commander entrypoint (natural language + subcommands)
│   ├── tui/         # React + Ink terminal interface
│   ├── backend/     # Local Fastify REST + WebSocket API
│   ├── automation/  # Timers, reminders, workflow runner, cron
│   └── plugins/     # Plugin registry & SDK
├── docs/            # Full documentation
├── scripts/         # Dev & release scripts
└── .github/         # CI workflows
```

## Documentation

| Area | Link |
| --- | --- |
| Documentation index | [docs/document.md](docs/document.md) |
| Quick start | [docs/quickstart.md](docs/quickstart.md) |
| Usage | [docs/usage.md](docs/usage.md) |
| Installation | [docs/installation.md](docs/installation.md) |
| Configuration | [docs/configuration.md](docs/configuration.md) |
| Terminal UI | [docs/terminal-ui.md](docs/terminal-ui.md) |
| CLI reference | [docs/cli-reference.md](docs/cli-reference.md) |
| Automation | [docs/automation.md](docs/automation.md) |
| Plugin development | [docs/plugin-development.md](docs/plugin-development.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Backend API | [docs/backend-api.md](docs/backend-api.md) |
| Troubleshooting | [docs/troubleshooting.md](docs/troubleshooting.md) |
| FAQ | [docs/faq.md](docs/faq.md) |
| Contributing | [docs/contributing.md](docs/contributing.md) |
| Changelog | [docs/changelog.md](docs/changelog.md) |
| Project info | [docs/info.md](docs/info.md) |

## License

Proprietary; all rights reserved. See [LICENSE.md](LICENSE.md). JUNO is **not open source** and
may not be copied, modified, or redistributed without prior written permission.