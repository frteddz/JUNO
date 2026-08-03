# JUNO - Installation

JUNO is installed three ways, depending on how you use it.

## 1. Development (from source)

```bash
git clone <your-repo-url> juno
cd juno
npm install
npm run dev -- "open firefox"
```

## 2. Global npm package (stable)

```bash
npm install -g @juno-cli/juno
juno "open firefox"
```

Update:

```bash
npm update -g @juno-cli/juno
```

## 3. Standalone binaries (coming in M4)

Single-file executables will be published for:

- Linux (Ubuntu and most modern distros)
- macOS
- Windows 10/11 (Command Prompt, PowerShell)

Binaries do not require a Node.js installation.

## Post-install

JUNO stores data in `~/.juno/`:

```text
~/.juno/
  config.json     # user configuration
  juno.db         # SQLite store (sessions, history, timers, reminders)
```

The directory can be overridden with the `JUNO_DATA_DIR` environment variable.

## Environment variables

See [configuration.md](configuration.md) for the full list, or copy the template:

```bash
cp .env.example .env
```