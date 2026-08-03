# Backend API — Build Prompt

Goal: design and build a backend API or service (REST/GraphQL/gRPC). Safe: no invented IP/connectors/hosts to strangers; secret → env var placeholders.

## 0 · INTAKE — ask before you build
**Batch A — product**
1. What does the API do? (resources, capabilities)
2. Client consumers (web SPA, mobile, third-party)
3. API style (REST/JSON, GraphQL, gRPC) or "recommend"
4. Framework/language (Node/Express, Python/FastAPI, Go, etc.) or "you choose a sensible default"

**Batch B — data & auth**
5. Persistence (Postgres, MySQL, Mongo, SQLite, in-memory for demo)
6. Auth/authz needs (JWT, OAuth, tokens, none)
7. Data model/entities

**Batch C — quality & deploy**
8. Testing expectations (unit/integration)?
9. Deploy target (local, Docker, Vercel/Netlify functions, a cloud)
10. Existing repo or fresh

## Before you build
- No real secrets; use env vars + `.env.example`.
- Define the endpoints/contract and confirm before implementing.