# JUNO - Troubleshooting

Common issues and their fixes.

## Build

**`npm install` fails on a peer dependency**
JUNO uses the built-in `node:sqlite` and has no native build step. If install fails, update Node:
```bash
node --version   # must be 24 or newer
```

**Long-lifetime timer does not fire**
`setTimeout` is limited to ~24.8 days. Use the scheduler for longer durations (see
[automation.md](automation.md)).

## Commands

**`open` did nothing**
Confirm the app is installed under that name, or use the explicit form:
```bash
juno "open firefox"
juno open firefox
```

**File path not found**
Use absolute or `~` paths and quote paths containing spaces:
```bash
juno "read ~/Projects/JUNO/README.md"
juno "list files in ~/Projects"
```

**Command was not understood**
Use parser-friendly phrasing:
```bash
juno "set a timer for 30 minutes"
```

## API / auth

**HTTP 401**
Set `JUNO_API_TOKEN` in both client and server and send `authorization: Bearer <token>`.

**`GET /api/token` returns 404**
A token is already set. Remove `JUNO_API_TOKEN` to allow re-generation.

## Data

**Where is data stored?**
In `~/.juno/` (`config.json`, `juno.db`). Override with `JUNO_DATA_DIR`.

**Reset history**
Stop JUNO, delete `~/.juno/juno.db`, or disable history:
```bash
juno config set historyEnabled false
```

## Terminal UI

**Code/UI renders incorrectly**
Use a modern ANSI-compatible terminal and ensure the window is wide enough.

## Logging

```bash
juno config set logLevel debug
```

Logs are written to `~/.juno/juno.log`.