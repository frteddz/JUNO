# JUNO - CLI Reference

`juno` is built with Commander.js. Global options and commands below.

## Global options

| Option | Description |
| --- | --- |
| `--json` | Output structured JSON for scripting |
| `-V, --version` | Print version |
| `-h, --help` | Show help |

## Commands

### `juno say <text>`
Execute a natural-language command.

```bash
juno say "set a timer for 30 minutes"
```

### `juno open <app>`
Open an application using the platform default launcher.

```bash
juno open firefox
```

### `juno close <app>`
Close an application.

```bash
juno close firefox
```

### `juno read <path>`
Print the contents of a file.

```bash
juno read README.md
```

### `juno timer <duration>`
Set a timer. Durations: `s`, `m`, `h`.

```bash
juno timer 30m
juno timer 90s
```

### `juno info`
Print system information (platform, host, CPU, memory, uptime, node version).

```bash
juno info --json
```

### `juno config get [key]`
Print configuration. With a key, prints just that value.

```bash
juno config get theme
juno config get
```

### `juno config set <key> <value>`
Update configuration.

```bash
juno config set theme light
juno config set accent "#d4af37"
juno config set confirmDestructive false
```

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Command execution failed |
| `2` | Invalid usage or invalid input |

## Streaming / future commands

The following are planned (see [milestone.md](milestone.md)): `juno plugin`, `juno history`,
`juno notify`, `juno workflow`.