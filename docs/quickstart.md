# JUNO - Quick Start

Get JUNO running in about a minute.

## Prerequisites
- Node.js **24+**
- npm 11+

## Install (development)

```bash
git clone <your-repo-url> juno
cd juno
npm install
```

## First run

Run the interactive terminal interface:

```bash
npm run start
```

Or run a single natural-language command:

```bash
npm run dev -- "open firefox"
```

> `npm run dev` runs the CLI through `tsx`. For a production-style run use `npm start`.

## Try these

```bash
juno "open firefox"
juno "set a timer for 30 minutes"
juno "show system info"
juno "list files in ~/Projects"
juno "what is 12 * 8 + 3?"
```

## Run the tests

```bash
npm test
npm run typecheck
npm run lint
```

## What's next
- [Installation options](installation.md)
- [Basic usage](usage.md)
- [Configuration](configuration.md)