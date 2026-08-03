import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useEffect, type ReactElement } from "react";
import { Markdown } from "./markdown.js";
import { Banner } from "./banner.js";
import {
  getStore,
  createDispatcher,
  parseCommand,
  describeIntent,
  createMessage,
  createEventBus,
  type JunoEventBus,
} from "@juno/core";
import { startTimer, scheduleReminder } from "@juno/automation";
import { useApp } from "./store.js";

type Props = { bus: JunoEventBus };

export function App({ bus }: Props): ReactElement {
  const smartBus = resolveBus(bus);
  const messages = useApp((s) => s.messages);
  const accent = useApp((s) => s.accent);

  useInput(() => {});

  return (
    <Box flexDirection="column" flexGrow={1}>
      <ChatHeader />
      {messages.length === 0 ? (
        <Welcome accent={accent} />
      ) : (
        <MessageList bus={smartBus} />
      )}
      <CommandBar />
    </Box>
  );
}

function resolveBus(bus: JunoEventBus | undefined): JunoEventBus {
  return bus ?? createEventBus();
}

function ChatHeader(): ReactElement {
  const accent = useApp((s) => s.accent);
  return (
    <Box borderStyle="round" borderColor={accent} paddingX={1}>
      <Text color={accent} bold>
        JUNO
      </Text>
      <Text dimColor>  Just Understands Natural Orders</Text>
    </Box>
  );
}

function Welcome({ accent }: { accent: string }): ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" paddingY={2}>
      <Banner accent={accent} />
      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Text dimColor>Try:</Text>
        <Text color={accent}>  open firefox</Text>
        <Text color={accent}>  set a timer for 10m</Text>
        <Text color={accent}>  find mynotes.txt on my pc</Text>
      </Box>
    </Box>
  );
}

function MessageList({ bus }: { bus: JunoEventBus }): ReactElement {
  const messages = useApp((s) => s.messages);
  const accent = useApp((s) => s.accent);
  const isMounted = useIsMounted();

  useEffect(() => {
    const off = bus.on("notify", (n) => {
      if (isMounted.current) {
        useApp.getState().addMessage(createMessage("", "system", `[${n.severity ?? "info"}] ${n.title}${n.body ? ` - ${n.body}` : ""}`));
      }
    });
    return off;
  }, [bus, isMounted]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {messages.map((m) => (
        <Box key={m.id} flexDirection="column" marginY={1} paddingX={1}>
          <Box>
            <Text bold color={m.role === "user" ? accent : m.role === "system" ? "yellow" : "green"}>
              {m.role === "user" ? "you" : m.role === "system" ? "system" : "juno"}
            </Text>
            <Text dimColor>  {shortId(m.id)}</Text>
          </Box>
          <Markdown>{m.content}</Markdown>
        </Box>
      ))}
    </Box>
  );
}

function CommandBar(): ReactElement {
  const input = useApp((s) => s.input);
  const busy = useApp((s) => s.busy);
  const accent = useApp((s) => s.accent);
  const setInput = useApp((s) => s.setInput);
  const setBusy = useApp((s) => s.setBusy);
  const addMessage = useApp((s) => s.addMessage);

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    addMessage(createMessage("", "user", text));
    void run(text).finally(() => setBusy(false));
  };

  return (
    <Box borderStyle="round" borderColor={busy ? "yellow" : accent} paddingX={1}>
      <Box>
        <Text color={accent} bold>
          {"❯"}
        </Text>
      </Box>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        placeholder="Try 'open firefox' or 'set a timer for 30 minutes'"
        focus
      />
    </Box>
  );
}

async function run(text: string): Promise<void> {
  const addMessage = useApp.getState().addMessage;
  const sessionId = getStore().createSession().id;
  const parsed = parseCommand(text);

  if (!parsed.ok) {
    addMessage(createMessage(sessionId, "system", parsed.error));
    return;
  }

  if (parsed.intent.intent === "timer") {
    const timer = startTimer({ durationMs: parsed.intent.durationMs, label: parsed.intent.label }, createEventBus());
    addMessage(createMessage(sessionId, "assistant", `Timer set (${timer.id.slice(0, 8)}): ${describeIntent(parsed.intent)}`));
    return;
  }
  if (parsed.intent.intent === "reminder") {
    const r = scheduleReminder({ at: parsed.intent.at, label: parsed.intent.label }, createEventBus());
    addMessage(createMessage(sessionId, "assistant", `Reminder set (${r.id.slice(0, 8)}): ${describeIntent(parsed.intent)}`));
    return;
  }

  const dispatcher = createDispatcher();
  const result = await dispatcher(parsed.intent);
  addMessage(createMessage(sessionId, "assistant", result.message));
  if (result.data && typeof result.data === "object" && "entries" in result.data) {
    const entries = result.data.entries as Array<{ name: string; type: string }>;
    addMessage(createMessage(sessionId, "assistant", entries.map((e) => `${e.type === "dir" ? "DIR " : "FILE"}  ${e.name}`).join("\n")));
  }
}

function shortId(id: string): string {
  return id ? id.slice(0, 8) : "";
}

function useIsMounted(): { current: boolean } {
  const ref = { current: false };
  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  });
  return ref;
}