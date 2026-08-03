# CLI Tools — Build Prompt

Goal: a useful, dependable command-line tool. Small scope, clear UX, testable. Safe: no invented creds.

## 0 · INTAKE — ask before you build
**Batch A — tool**
1. What does the tool do (one sentence, the Job/testcase)?
2. Language/runtime (Python, Node, Rust, Go, bash script) or "choose a obvious default"
3. Input/output (files, stdin, args, flags)
**Batch B — UX**
4. Commands & flags you want
5. Error-handling expectations (exit codes, `--help`, colored output?)
6. Shipping: install method (pipx, npm global, single binary)
**Batch C — quality**
7. Tests to include
8. Existing project/repo?
## Before you build
- Echo the CLI contract (name + flags + I/O) and confirm.