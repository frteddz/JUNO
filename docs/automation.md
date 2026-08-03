# JUNO - Automation

JUNO automates everyday computer tasks: accepting a natural-language command, understanding it,
gathering needed resources, executing one or more local actions, and reporting results.

## What gets automated

- Opening and closing applications
- Reading, listing, and searching files
- Running terminal commands
- Setting timers and reminders
- Retrieving system information

## Timers & reminders

```bash
juno timer 30m
juno say "set a timer for 30 minutes"
juno say "remind me in 10 minutes to take a break"
juno say "remind me at 4:30pm to send the report"
```

Timers and reminders persist in SQLite and emit `timer.fired` / `reminder.fired` events that the
TUI renders as notifications.

## Workflows

Workflows are ordered lists of steps (`command` or `shell`). A failed step stops dependent steps;
independent tasks continue when possible.

```ts
import { runWorkflow } from "@juno/automation";
import { createDispatcher } from "@juno/core";

await runWorkflow(
  [
    { kind: "command", text: "open firefox" },
    { kind: "command", text: "show system info" },
  ],
  { dispatcher: createDispatcher(), onStatus: (msg) => console.log(msg) }
);
```

## Retry & failure handling

- Transient failures are retried with **exponential backoff** (default: 3 attempts, base 250ms, x2).
- **Permanent failures** (ENOENT, invalid input, auth) are **not** retried.
- Errors are logged and surfaced with actionable messages in the TUI.
- Destructive operations request confirmation before execution.
- When a rollback is possible, JUNO avoids leaving system state partially modified.

## Scheduling (cron)

Minimal cron support (`minute hour day-of-month month day-of-week`) is available in
`@juno/automation`:

```ts
import { parseCron, cronMatches } from "@juno/automation";

const everyMorning = parseCron("0 9 * * *");
const now = new Date();
if (cronMatches(everyMorning, now)) {
  // run scheduled task
}
```

## Safety

- No secrets are committed; integrations use `JUNO_*` env placeholders.
- Automation runs locally; no server or Docker is required for normal operation.