# JUNO - Backend API

JUNO provides a **local-first** REST API (built on Fastify) with optional WebSocket event
streaming. It is intended for internal integrations (CLI, TUI, plugins) and optional local
HTTP/WebSocket clients. It is **not** a public cloud API.

## Base

Default base URL: `http://127.0.0.1:4173`.

Configure via `JUNO_API_PORT`, `JUNO_API_HOST`, and `config.json`.

## Authentication

Set a local token:

```bash
# generate
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# send as a request header
-H "authorization: Bearer <token>"
```

If `JUNO_API_TOKEN` is set, requests without a valid token are rejected.

## Endpoints

### `GET /health`
Health check. Returns `{ ok, app, time }`.

### `GET /api/config`
Returns the resolved configuration.

### `GET /api/system`
Returns system information:
`{ data: { platform, hostname, cpuModel, cpuCount, usedMemPercent, ... } }`.

### `GET /api/token`
Generates a new API token. Returns `403` if `JUNO_API_TOKEN` is already set.

### `POST /api/sessions`
Creates a chat session.

**Response:** `{ id, createdAt }`

### `GET /api/sessions/:id/messages`
Returns messages for a session.

**Response:** `{ messages: [...] }`

### `POST /api/command`
Execute a natural-language command.

**Request:**
```json
{ "text": "open firefox", "sessionId": "optional-uuid" }
```

**Response:**
```js
{
  "message": "Opened firefox",
  "ok": true,
  "data": null,
  "intent": { "intent": "open", "app": "firefox" }
}
```

If parsing fails, returns HTTP `400` with `{ error, message }`.

## WebSocket streaming

A WebSocket server is registered (via `@fastify/websocket`). Core services publish events on the
in-process event bus (`chat.message`, `timer.fired`, `reminder.fired`, `notify`,
`workflow.status`). Event streaming to WebSocket clients is on the roadmap (see
[milestone.md](milestone.md), M2/M3).

## Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid request / unparseable command |
| `401` | Missing or invalid token |
| `404` | Not found |

See the server source in `packages/backend/src/server.ts` for the canonical route signatures.