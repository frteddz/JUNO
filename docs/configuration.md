# JUNO - Configuration

JUNO reads configuration from `~/.juno/config.json`, overridden by environment variables and
CLI flags.

## Config file

```json
{
  "theme": "dark",
  "accent": "#d4af37",
  "apiPort": 4173,
  "apiHost": "127.0.0.1",
  "historyEnabled": true,
  "confirmDestructive": true,
  "animate": true,
  "logLevel": "info"
}
```

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `theme` | `"dark" \| "light"` | `dark` | UI theme |
| `accent` | string | `#d4af37` | Primary accent color |
| `dataDir` | string | `~/.juno` | Data directory |
| `apiPort` | number | `4173` | Local API port |
| `apiHost` | string | `127.0.0.1` | Local API bind host |
| `historyEnabled` | boolean | `true` | Persist chat history |
| `confirmDestructive` | boolean | `true` | Confirm destructive actions |
| `animate` | boolean | `true` | UI animations / streaming |
| `logLevel` | string | `info` | `debug \| info \| warn \| error` |

## Environment variables

See `.env.example`:

| Variable | Purpose |
| --- | --- |
| `JUNO_API_TOKEN` | Local API token for socket/HTTP clients |
| `JUNO_DATA_DIR` | Override data directory |
| `JUNO_API_PORT` | Override API port |
| `JUNO_API_HOST` | Override API host |
| `JUNO_LOG_LEVEL` | Log level |
| `WEATHER_API_KEY` | Optional weather integration |
| `SEARCH_API_KEY` | Optional search integration |

## CLI

```bash
juno config get theme
juno config set theme light
juno config set accent "#7f9cf5"
```

## Setting the API token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# paste into JUNO_API_TOKEN in your .env
```