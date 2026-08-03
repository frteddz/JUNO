#!/usr/bin/env bash
set -euo pipefail

# Dev and release scripts for JUNO.

case "${1:-}" in
  build)
    npm run build
    ;;
  dev)
    npm run dev -- "${@:2}"
    ;;
  "start")
    npm start
    ;;
  typecheck)
    npm run typecheck
    ;;
  lint)
    npm run lint
    ;;
  test)
    npm test
    ;;
  "test:watch")
    npm test --workspaces -- --watch
    ;;
  clean)
    rm -rf packages/*/dist coverage
    ;;
  bootstrap)
    npm install
    echo "JUNO installed. Run: npm run dev -- \"open firefox\""
    ;;
  version)
    npm version "${2:?usage: ./scripts/dev.sh version <new-version>}"
    ;;
  *)
    echo "Usage: $0 {build|dev|typecheck|lint|test|clean|repo|version|test:watch}" >&2
    exit 2
    ;;
esac