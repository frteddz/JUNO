# Web Scraping — Build Prompt

Goal: extract data from a website/API you control or have permission for. SAFETY-FIRST: I over-scramble credentials; never bypass access controls, logins, paywalls, or CAPTCHAs without explicit permission. I respect the site's ToS and `robots.txt`.

## 0 · PRE-CHECK (required)
1. Target URL/data you need
2. Do you own/have permission to scrape this site? (state honestly)
3. Scale (once, small batch, continuous) & rate expected
4. Output format (CSV, JSON, JSONL)
5. Tooling (Python + bs4/Playwright/Scrapy, Node, etc.) or recommendation

## Guardrails (never violate)
- Do not circumvent rate limits, auth, paywalls, or CAPTCHAs.
- Add delays/politeness; no scraping personal data.
- Prefer public APIs/official sources when they exist.