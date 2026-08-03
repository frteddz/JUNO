# Automation — Build Prompt

Goal: automate a repetitive workflow (scheduled jobs, fileing, scraping-to-backend, orchestration). Safe. No invented hosts/secrets.

## 0 · INTTAKE (required)
1. What is the manual task you want automated (step-by-step)?
2. Trigger: schedule (every morning), timewatch, event, webhook?
3. Inputs & outputs (files, emails, CSVs, DB, APIs)
4. Environment where it runs (local cron, server, CI, docker)
5. Tech language/preference (Python, sh, Node, n8n, GitHub Actions)
6. Any services/APIs involved (never real keys; use placeholders)
7. Failure handling: retry, email-alert on error?
## Deliver
- Idempotent, loggable automation. Dry-run first if destructive.
- No secrets committed; `.env.example`.