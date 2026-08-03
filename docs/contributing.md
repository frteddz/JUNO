# Contributing to JUNO

Thanks for working on JUNO! This project is **not open source** (see
[LICENSE.md](../LICENSE.md)); contributions happen internally. These conventions keep it clean.

## Setup

```bash
git clone <your-repo-url> juno
cd juno
npm install
```

## Commands

```bash
npm run typecheck     # tsc --noEmit across packages
npm run lint          # ESLint (9) + Prettier
npm test              # Vitest across packages
npm run build         # tsup build all packages
```

Pre-commit hooks (Husky + lint-staged) run on staged `.ts`/`.tsx` files.

## Conventions

- **TypeScript, strict mode**, ESM (`"type": "module"`).
- Validation with **Zod**. Secrets only via env; never commit real values.
- **No comments** in code unless necessary.
- Type-check, lint, and test before finishing. State the exact run/test command in the PR.
- Keep user-facing examples in `docs/` accurate and copy-paste runnable. Update
  [changelog.md](changelog.md) in the same change.

## Branching

- Work behind small feature branches.
- Open a PR with a concise description and link the relevant milestone from
  [milestone.md](milestone.md).

## Definition of done

- `npm run typecheck`, `npm run lint`, and `npm test` pass.
- No invented/fabricated data or endpoints.
- Documentation updated where behavior changed.