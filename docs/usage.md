# JUNO - Basic Usage

JUNO understands natural language and also provides classic subcommands.

## Natural language (primary)

```bash
juno "open firefox"
juno "close firefox"
juno "set a timer for 30 minutes"
juno "remind me in 10 minutes to take a break"
juno "show system info"
juno "read ~/Projects/JUNO/README.md"
juno "list files in ~/Projects"
juno "what is 12 * 8 + 3?"
```

## Subcommands (scripting & power users)

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

## `--json` output

Useful for scripts:

```bash
juno info --json
juno read package.json --json
```

## Interactive mode

```bash
juno --run
```

Opens the Ink-based terminal UI (chat, history, notifications, themes). See
[terminal-ui.md](terminal-ui.md).

## stdin (piped input)

```bash
echo "open firefox" | juno
```

## Destructive operations

JUNO asks for confirmation before potentially destructive actions (configurable via
`confirmDestructive`).

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | General error / command failed |
| `2` | Usage error or invalid input |