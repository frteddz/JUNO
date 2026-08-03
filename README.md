<div align="center">

# JUNO

**J**ust **U**nderstands **N**atural **O**rders

_A local-first command-line assistant that understands natural language and runs tasks on your
computer — right from the terminal. Offline-first, with optional DeepSeek AI._

[![CI](https://img.shields.io/github/actions/workflow/status/frteddz/JUNO/ci.yml?branch=main&label=CI&logo=github)](https://github.com/frteddz/JUNO/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Proprietary-999999.svg)](#license)

</div>

---

JUNO takes a plain-English command, figures out what you want, and does it: open apps, read and
search files, set timers and reminders, show system info, and crunch numbers. By default every
message is answered by **DeepSeek AI** (chat.deepseek.com) — it replies conversationally or hands
back a local action for JUNO to execute. When the AI is off or unavailable, a deterministic local
parser covers the same commands: **no cloud, no API keys, nothing leaves your machine.**

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

# interactive terminal interface (or just: juno)
npm run tui

# one-shot command
npm run dev -- "open firefox"
```

> To use the bare `juno` command from this repo (instead of `npm run dev -- "…"`), link it once:
> ```bash
> cd JUNO/packages/cli && npm link
> ```
> or install globally with `npm install -g .`. All examples below assume `juno` is on your PATH.

Once `juno` is on your PATH:

```bash
juno                 # launch the interactive UI
juno --help          # list subcommands
juno --version       # show version
```

## AI mode

JUNO can answer anything with DeepSeek (chat.deepseek.com), exactly like Cedrus does. Every message goes through the AI first; it either replies conversationally or returns a local action (open app, timer, reminder, find file, math, system info) that JUNO executes on your machine. If the AI is unavailable (no sign-in, busy), JUNO falls back to its deterministic parser so nothing breaks.

Set it up once:

```bash
juno auth                 # opens a browser to sign in to DeepSeek (free account)
juno "what is the capital of France?"
```

```bash
juno "open firefox and search ram prices"
juno "set a timer for 10m"
juno "find mynotes.txt on my pc"
```

## Offline mode (no AI)

JUNO also works fully offline with a deterministic command parser, no AI provider or API key:

```bash
juno config set aiProvider off
```

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

You can also use classic subcommands (offline mode):

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
| **From source (dev)** | `git clone …` + `npm install` + `cd packages/cli && npm link` |
| **Global npm (stable)** | `npm install -g @juno-cli/juno` <sup>1</sup> |
| **Standalone binaries** | Linux / macOS / Windows executable <sup>2</sup> |

<sup>1</sup> Planned under the `@juno-cli` scope. <br>
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
│   ├── ai/          # DeepSeek engine (browser session, streaming, action protocol)
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