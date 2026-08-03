# JUNO - FAQ

## What is JUNO?

JUNO (**Just Understands Natural Orders**) is a local-first, non-AI assistant that understands
natural-language commands and executes tasks on your computer through a modern terminal interface.
See [info.md](info.md).

## Is JUNO an AI?

No. JUNO is non-AI. It parses natural-language commands with deterministic rules and executes
local actions (open apps, file operations, timers, reminders, system info, calculations).

## Does JUNO require a server or Docker?

For normal operation, no. It runs locally in your terminal on Linux, macOS, and Windows.

## Can it be used over SSH / WSL?

Yes. It works in any ANSI-compatible terminal, including SSH sessions and WSL.

## Does JUNO send my data anywhere?

Core functionality is local and offline. External integrations (weather, search, updates) are
optional and only contacted when you request them, using env placeholders rather than committed
secrets.

## How do timers and reminders persist?

Timers and reminders are stored in SQLite (`~/.juno/juno.db`) and emit events when they fire,
shown as notifications in the terminal UI.

## What if a workflow step fails?

Transient steps retry with exponential backoff; permanent failures are not retried. Dependent
steps stop, independent tasks continue if possible. Details in [automation.md](automation.md).

## How do I add commands without modifying core?

Write a plugin. See [plugin-development.md](plugin-development.md).

## Is JUNO open source?

No. JUNO is proprietary and private. See [LICENSE.md](../LICENSE.md).

## Where is the documentation?

Start from the [Documentation Index](document.md) or the root [README.md](../README.md).