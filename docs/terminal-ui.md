# JUNO - Terminal UI

The JUNO terminal interface is built with **React 19 + Ink 6**. It runs in any ANSI-compatible
terminal (Linux, macOS, Windows, SSH, WSL).

## Start

```bash
juno --run
# or
npm run dev -- --run
```

## Layout

- **Header** - JUNO branding with the accent color.
- **Message list** - chat history with `you` / `juno` / `system` labels and Markdown rendering.
- **Input bar** - natural-language prompt. Type and press Enter to run.
- **Notifications** - timer/reminder and system notices appear as system messages.

## Example session

```text
┌─ JUNO ──────────────────────────────────────┐
│ JUNO   Just Understands Natural Orders      │
└─────────────────────────────────────────────┘

you  a3f9c1d2
  open firefox

juno  82be30aa
  Opened firefox

you  1c99d4e8
  set a timer for 30 minutes

juno  60ab2f1d
  Timer set: 30m (41d05a2c)

❯ █
```

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Enter | Run command |
| Backspace | Delete character |
| Ctrl+C / Esc | Quit |

## Planned UX (roadmap)

- Command palette
- Settings pages
- File browser
- Streaming responses with progress indicators
- Code blocks with Shiki highlighting
- Light theme, configurable themes, reduced-motion option
- Command history browsing

## Accessibility goals

- 100% keyboard-first navigation
- High-contrast dark and light themes
- Color is never the only indicator of status
- Clear focus and selection states
- Respect terminal font size and accessibility settings
- Optional reduced animations