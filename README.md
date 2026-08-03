# JUNO

**J**ust **U**nderstands **N**atural **O**rders.

JUNO is a **local-first, non-AI** assistant that understands natural-language commands and
executes tasks on your computer through a modern terminal interface.

> Notice: JUNO is **proprietary / not open source**. See [LICENSE.md](LICENSE.md).

## Features

- **Natural-language command execution** - interpret plain English and run local actions
- **Application & process management** - launch, close, and manage apps
- **Built-in utility commands** - timers, reminders, weather-ready, system info, calculations,
  file operations
- **Interactive terminal experience** - chat UI with history, Markdown, streaming, keyboard
  shortcuts, themes
- **Extensible plugin system** - add commands without touching the core
- **Local-first** - fully offline for core functionality; optional integrations on request

## Quick start

```bash
npm install
npm run dev -- "open firefox"
```

Run the interactive terminal interface:

```bash
npm start
```

## Examples

```bash
juno "open firefox"
juno "set a timer for 30 minutes"
juno "show system info"
juno "list files in ~/Projects"
juno "what is 12 * 8 + 3?"
```

## Installation

- Development: `npm install`
- Stable: `npm i -g @juno-cli/juno`
- Standalone binaries: Linux, macOS, Windows (roadmap)

See [docs/installation.md](docs/installation.md).

## Documentation

- [Documentation index](docs/document.md) - all sections
- [Quick start](docs/quickstart.md) · [Usage](docs/usage.md)
- [Configuration](docs/configuration.md)
- [Terminal UI](docs/terminal-ui.md) · [CLI reference](docs/cli-reference.md)
- [Automation](docs/automation.md) · [Plugin development](docs/plugin-development.md)
- [Architecture](docs/architecture.md) · [Backend API](docs/backend-api.md)
- [Troubleshooting](docs/troubleshooting.md) · [FAQ](docs/faq.md)
- [Project info](docs/info.md) · [Changelog](docs/changelog.md)
- [Milestones](docs/milestone.md) · [Progress](docs/progress.md)

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint + Prettier
npm test            # Vitest
npm run build       # tsup build
```

JUNO targets Linux, macOS, and Windows on Node.js 24+.

## License

Proprietary; all rights reserved. See [LICENSE.md](LICENSE.md).