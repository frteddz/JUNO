import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Markdown } from "./markdown.js";
import { Banner } from "./banner.js";
import {
  getStore,
  createDispatcher,
  parseCommand,
  describeIntent,
  createMessage,
  createEventBus,
  getConfig,
  saveConfig,
  type JunoEventBus,
  type ChatMessage,
} from "@juno/core";
import { startTimer, scheduleReminder } from "@juno/automation";
import { AiEngine, runAiTurn, type AiEngineLike } from "@juno/ai";
import { useApp } from "./store.js";

const SIDEBAR_W = 26;
const HEADER_H = 2;
const FOOTER_H = 1;

let aiEngine: AiEngineLike | null = null;

process.once("exit", () => {
  if (aiEngine) void aiEngine.close();
});

type Props = { bus: JunoEventBus };

export function App({ bus }: Props): ReactElement {
  const smartBus = resolveBus(bus);
  const { stdout } = useStdout();
  const width = stdout.columns || 100;
  const height = stdout.rows || 30;

  const messages = useApp((s) => s.messages);
  const input = useApp((s) => s.input);
  const busy = useApp((s) => s.busy);
  const accent = useApp((s) => s.accent);
  const theme = useApp((s) => s.theme);
  const sidebar = useApp((s) => s.sidebar);
  const setInput = useApp((s) => s.setInput);
  const setScrollTop = useApp((s) => s.setScrollTop);
  const setFollow = useApp((s) => s.setFollow);

  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [provider, setProvider] = useState("offline");
  const cursor = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsed = useElapsed(busy);
  const busyRef = useRef(false);
  busyRef.current = busy;

  const showToast = (text: string): void => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    void getConfig().then((cfg) => setProvider(cfg.aiProvider === "deepseek" ? "DeepSeek" : "Offline"));
  }, []);

  useEffect(() => {
    const off = smartBus.on("notify", (n) => {
      useApp
        .getState()
        .addMessage(createMessage("", "system", `[${n.severity ?? "info"}] ${n.title}${n.body ? ` - ${n.body}` : ""}`));
    });
    return off;
  }, [smartBus]);

  const chatW = Math.max(20, width - (sidebar ? SIDEBAR_W : 0));
  const wrapW = Math.max(10, chatW - 6);
  const composerH = Math.min(8, wrapText(input, wrapW).length) + 2;
  const viewH = Math.max(1, height - HEADER_H - composerH - FOOTER_H - 1);

  const contentH = useMemo(() => heightsOf(messages, chatW).reduce((a, b) => a + b, 0), [messages, chatW]);
  const maxScroll = Math.max(0, contentH - viewH);

  const scrollChat = (delta: number): void => {
    const st = useApp.getState();
    if (delta > 0) {
      if (st.scrollTop >= maxScroll - 1) {
        st.setFollow(true);
        st.setScrollTop(0);
      } else {
        st.setFollow(false);
        st.setScrollTop(Math.min(maxScroll, st.scrollTop + delta));
      }
    } else {
      st.setFollow(false);
      st.setScrollTop(Math.max(0, st.scrollTop + delta));
    }
  };

  const insert = (ch: string): void => {
    const st = useApp.getState();
    const d = st.input;
    const c = cursor.current;
    st.setInput(d.slice(0, c) + ch + d.slice(c));
    cursor.current = c + ch.length;
  };

  const backspace = (): void => {
    const st = useApp.getState();
    const c = cursor.current;
    if (c <= 0) return;
    st.setInput(st.input.slice(0, c - 1) + st.input.slice(c));
    cursor.current = c - 1;
  };

  const del = (): void => {
    const st = useApp.getState();
    const c = cursor.current;
    if (c >= st.input.length) return;
    st.setInput(st.input.slice(0, c) + st.input.slice(c + 1));
  };

  const moveCursor = (delta: number): void => {
    const d = useApp.getState().input;
    cursor.current = Math.max(0, Math.min(d.length, cursor.current + delta));
  };

  const moveWord = (delta: number): void => {
    const d = useApp.getState().input;
    let c = cursor.current;
    if (delta > 0) {
      while (c < d.length && d[c] !== " ") c++;
      while (c < d.length && d[c] === " ") c++;
    } else {
      while (c > 0 && d[c - 1] === " ") c--;
      while (c > 0 && d[c - 1] !== " ") c--;
    }
    cursor.current = c;
  };

  const submit = (): void => {
    const text = useApp.getState().input.trim();
    if (!text) return;
    if (busyRef.current) {
      showToast("still replying…");
      return;
    }
    useApp.getState().setInput("");
    cursor.current = 0;
    setFollow(true);
    if (text === "/help" || text === "/?") {
      setShowHelp(true);
      return;
    }
    if (text.startsWith("/")) {
      void runSlash(text, showToast, setProvider);
      return;
    }
useApp.getState().addMessage(createMessage(getStore().createSession().id, "user", text));
    void run(text);
  };

  useInput((raw, key) => {
    if (showHelp) {
      if (key.escape || key.return) setShowHelp(false);
      return;
    }
    if (key.escape) {
      if (input) {
        setInput("");
        cursor.current = 0;
      } else {
        setShowHelp(true);
      }
      return;
    }
    if (key.ctrl && raw === "c") {
      process.exit(0);
      return;
    }
    if (key.ctrl && raw === "b") {
      useApp.getState().setSidebar(!useApp.getState().sidebar);
      return;
    }
    if (key.ctrl && raw === "t") {
      useApp.getState().setTheme(useApp.getState().theme === "dark" ? "light" : "dark");
      return;
    }
    if (key.pageUp || (key.ctrl && key.upArrow)) {
      scrollChat(-Math.max(3, Math.floor(viewH / 2)));
      return;
    }
    if (key.pageDown || (key.ctrl && key.downArrow)) {
      scrollChat(Math.max(3, Math.floor(viewH / 2)));
      return;
    }
    if (key.home) {
      setFollow(false);
      setScrollTop(0);
      return;
    }
    if (key.end) {
      setFollow(true);
      setScrollTop(0);
      return;
    }
    if (key.return) {
      if (key.shift) {
        insert("\n");
      } else {
        submit();
      }
      return;
    }
    if (key.backspace) {
      backspace();
      return;
    }
    if (key.delete) {
      del();
      return;
    }
    if (key.leftArrow) {
      if (key.ctrl) moveWord(-1);
      else moveCursor(-1);
      return;
    }
    if (key.rightArrow) {
      if (key.ctrl) moveWord(1);
      else moveCursor(1);
      return;
    }
    if (key.upArrow) {
      if (!input) scrollChat(-3);
      return;
    }
    if (key.downArrow) {
      if (!input) scrollChat(3);
      return;
    }
    if (key.tab || key.meta) return;
    for (const ch of raw) {
      if (ch.charAt(0) >= " ") insert(ch);
    }
  });

  const t = theme === "dark" ? DARK : LIGHT;

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box width={width} height={HEADER_H} borderStyle="round" borderColor={accent} paddingX={1}>
        <Text color={accent} bold>
          JUNO
        </Text>
        <Text dimColor>  Just Understands Natural Orders</Text>
        <Box flexGrow={1} />
        <Text dimColor>{provider}</Text>
        <Text color={busy ? "yellow" : "green"} dimColor={!busy}>
          {busy ? `  ● ${(elapsed / 1000).toFixed(1)}s` : ""}
        </Text>
      </Box>
      <Box flexDirection="row" width={width} height={viewH + 1}>
        {sidebar && <Sidebar width={SIDEBAR_W} height={viewH + 1} t={t} provider={provider} />}
        <Box flexDirection="column" width={chatW} height={viewH + 1}>
          {showHelp ? (
            <HelpOverlay width={chatW} height={viewH + 1} t={t} />
          ) : messages.length === 0 ? (
            <Welcome accent={accent} />
          ) : (
            <ChatView width={chatW} height={viewH} t={t} />
          )}
        </Box>
      </Box>
      <Composer
        width={chatW}
        input={input}
        cursor={cursor.current}
        busy={busy}
        accent={accent}
      />
      <Box width={width} height={FOOTER_H} paddingX={1}>
        {toast ? (
          <Text color={t.toast}> {toast}</Text>
        ) : (
          <Text dimColor>
            Enter send · Shift+Enter newline · Esc clear · Ctrl+B sidebar · Ctrl+T theme · /help
          </Text>
        )}
      </Box>
    </Box>
  );
}

function resolveBus(bus: JunoEventBus | undefined): JunoEventBus {
  return bus ?? createEventBus();
}

function Welcome({ accent }: { accent: string }): ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" paddingY={2}>
      <Banner accent={accent} />
      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Text dimColor>Try:</Text>
        <Text color={accent}>  open firefox and search ram prices</Text>
        <Text color={accent}>  set a timer for 10m</Text>
        <Text color={accent}>  find mynotes.txt on my pc</Text>
        <Text color={accent}>  /help</Text>
      </Box>
    </Box>
  );
}

function Sidebar({
  width,
  height,
  t,
  provider,
}: {
  width: number;
  height: number;
  t: Theme;
  provider: string;
}): ReactElement {
  const accent = useApp((s) => s.accent);
  const theme = useApp((s) => s.theme);
  const messages = useApp((s) => s.messages);
  return (
    <Box
      width={width}
      height={height}
      borderStyle="round"
      borderColor={accent}
      paddingX={1}
      flexDirection="column"
      overflow="hidden"
    >
      <Text color={accent} bold>
        JUNO
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Status k="AI" v={provider} />
        <Status k="theme" v={theme} />
        <Status k="messages" v={String(messages.length)} />
      </Box>
      <Box marginTop={2} flexDirection="column">
        <Text dimColor>shortcuts</Text>
        <Text dimColor>  Ctrl+B sidebar</Text>
        <Text dimColor>  Ctrl+T theme</Text>
        <Text dimColor>  Ctrl+C quit</Text>
      </Box>
      <Box marginTop={2} flexDirection="column">
        <Text dimColor>commands</Text>
        <Text dimColor>  /help</Text>
        <Text dimColor>  /account</Text>
        <Text dimColor>  /mode</Text>
        <Text dimColor>  /clear</Text>
        <Text dimColor>  /exit</Text>
      </Box>
      <Box flexGrow={1} />
      <Text color={t.faint}>  Just Understands Natural Orders</Text>
    </Box>
  );
}

function Status({ k, v }: { k: string; v: string }): ReactElement {
  return (
    <Box>
      <Text dimColor>
        {k.padEnd(9)}
      </Text>
      <Text>{v}</Text>
    </Box>
  );
}

function ChatView({ width, height, t }: { width: number; height: number; t: Theme }): ReactElement {
  const messages = useApp((s) => s.messages);
  const busy = useApp((s) => s.busy);
  const accent = useApp((s) => s.accent);
  const scrollTop = useApp((s) => s.scrollTop);
  const follow = useApp((s) => s.follow);
  const setScrollTop = useApp((s) => s.setScrollTop);

  const bubbleW = Math.max(10, width - 6);
  const heights = useMemo(() => heightsOf(messages, width), [messages, width]);
  const contentH = heights.reduce((a, b) => a + b, 0);
  const maxScroll = Math.max(0, contentH - height);
  const scroll = follow ? maxScroll : Math.min(scrollTop, maxScroll);

  let topPad = scroll;
  let start = 0;
  for (let i = 0; i < messages.length; i++) {
    const h = heights[i] ?? 0;
    if (topPad >= h) {
      topPad -= h;
      start = i + 1;
    } else break;
  }
  let renderedH = 0;
  for (let i = start; i < messages.length; i++) renderedH += heights[i] ?? 0;
  const bottomPad = Math.max(0, height - topPad - renderedH);

  useEffect(() => {
    if (follow) setScrollTop(maxScroll);
  }, [maxScroll, follow, setScrollTop]);

  const last = messages[messages.length - 1];

  return (
    <Box flexDirection="column" width={width} height={height} overflow="hidden">
      {!follow && (
        <Text dimColor>
          ↑ older · PgUp/PgDn · End to jump to bottom
        </Text>
      )}
      <Box height={topPad} flexShrink={0} />
      {messages.slice(start).map((m) => (
        <Message key={m.id} m={m} width={bubbleW} accent={accent} t={t} thinking={busy && m === last && m.content === ""} />
      ))}
      <Box height={bottomPad} flexShrink={0} />
    </Box>
  );
}

function Message({
  m,
  width,
  accent,
  t,
  thinking,
}: {
  m: ChatMessage;
  width: number;
  accent: string;
  t: Theme;
  thinking: boolean;
}): ReactElement {
  const isUser = m.role === "user";
  const isSystem = m.role === "system";
  const color = isUser ? accent : isSystem ? t.faint : t.juno;
  return (
    <Box flexDirection="column" marginY={1} paddingX={1} width={width + 2}>
      <Text bold color={color}>
        {isUser ? "you" : isSystem ? "system" : "juno"}
      </Text>
      {m.content ? (
        <Markdown>{m.content}</Markdown>
      ) : thinking ? (
        <Text dimColor>…</Text>
      ) : null}
    </Box>
  );
}

function Composer({
  width,
  input,
  cursor,
  busy,
  accent,
}: {
  width: number;
  input: string;
  cursor: number;
  busy: boolean;
  accent: string;
}): ReactElement {
  const wrapW = Math.max(10, width - 6);
  const lines = wrapText(input, wrapW);
  const { line: curLine, col } = cursorPos(input, wrapW, cursor);
  const display = lines.length === 0 ? [""] : lines;
  const h = Math.min(8, display.length) + 2;
  return (
    <Box width={width} height={h} borderStyle="round" borderColor={busy ? "yellow" : accent} paddingX={1} flexShrink={0}>
      <Box width={width - 6} flexDirection="column">
        {display.slice(-8).map((line, i) => {
          const idx = lines.length - display.slice(-8).length + i;
          if (idx !== curLine) {
            return (
              <Text key={i}>
                {line || " "}
              </Text>
            );
          }
          const before = line.slice(0, col);
          const at = line[col] ?? " ";
          const after = line.slice(col + 1);
          return (
            <Text key={i}>
              {before}
              <Text inverse>{at}</Text>
              {after}
            </Text>
          );
        })}
        {input === "" && !busy && (
          <Text dimColor>
            {" "}ask anything, or try 'open firefox'…
          </Text>
        )}
      </Box>
    </Box>
  );
}

function HelpOverlay({ width, height, t }: { width: number; height: number; t: Theme }): ReactElement {
  const accent = useApp((s) => s.accent);
  return (
    <Box width={width} height={height} flexDirection="column" justifyContent="center" alignItems="center">
      <Box width={Math.min(62, width - 6)} borderStyle="round" borderColor={accent} paddingX={2} paddingY={1} flexDirection="column">
        <Text bold color={accent}>
          JUNO help
        </Text>
        <Text dimColor>
          {"  "}enter send · shift+enter newline · esc clear draft
        </Text>
        <Text dimColor>
          {"  "}pgup/pgdn scroll · home/end jump · ctrl+b sidebar
        </Text>
        <Text dimColor>
          {"  "}ctrl+t theme · ctrl+c quit
        </Text>
        <Text dimColor>
          {"  "}/help · /clear · /account · /mode · /exit
        </Text>
        <Text color={t.faint}>
          {"  "}Ask anything: open firefox, set a timer, find files, math…
        </Text>
      </Box>
    </Box>
  );
}

async function run(text: string): Promise<void> {
  const addMessage = useApp.getState().addMessage;
  const updateMessage = useApp.getState().updateMessage;
  const sessionId = getStore().createSession().id;
  const assistant = createMessage(sessionId, "assistant", "");
  addMessage(assistant);
  const streamId = assistant.id;

  const config = await getConfig();
  if (config.aiProvider === "deepseek") {
    const engine = getAiEngine();
    try {
      const result = await runAiTurn(engine, text, createEventBus(), (patch) => {
        if (patch.phase === "generating" || patch.phase === "done") {
          updateMessage(streamId, { content: patch.text });
        }
      });
      if (result.action) {
        updateMessage(streamId, { content: result.message });
      }
      return;
    } catch (err) {
      updateMessage(streamId, {
        content: err instanceof Error ? `AI unavailable: ${err.message}` : String(err),
      });
    }
    return;
  }

  await runDeterministic(text, sessionId, streamId);
}

async function runDeterministic(text: string, sessionId: string, streamId: string): Promise<void> {
  const addMessage = useApp.getState().addMessage;
  const updateMessage = useApp.getState().updateMessage;
  const parsed = parseCommand(text);

  if (!parsed.ok) {
    updateMessage(streamId, { content: parsed.error });
    return;
  }

  if (parsed.intent.intent === "timer") {
    const timer = startTimer({ durationMs: parsed.intent.durationMs, label: parsed.intent.label }, createEventBus());
    updateMessage(streamId, { content: `Timer set (${timer.id.slice(0, 8)}): ${describeIntent(parsed.intent)}` });
    return;
  }
  if (parsed.intent.intent === "reminder") {
    const r = scheduleReminder({ at: parsed.intent.at, label: parsed.intent.label }, createEventBus());
    updateMessage(streamId, { content: `Reminder set (${r.id.slice(0, 8)}): ${describeIntent(parsed.intent)}` });
    return;
  }

  const dispatcher = createDispatcher();
  const result = await dispatcher(parsed.intent);
  updateMessage(streamId, { content: result.message });
  if (result.data && typeof result.data === "object" && "entries" in result.data) {
    const entries = result.data.entries as Array<{ name: string; type: string }>;
    addMessage(createMessage(sessionId, "assistant", entries.map((e) => `${e.type === "dir" ? "DIR " : "FILE"}  ${e.name}`).join("\n")));
  }
}

async function runSlash(
  text: string,
  showToast: (s: string) => void,
  setProvider: (p: string) => void,
): Promise<void> {
  const [cmd, ...rest] = text.split(/\s+/);
  const body = rest.join(" ").trim();
  const st = useApp.getState();
  switch (cmd) {
    case "/clear":
      st.clear();
      st.setFollow(true);
      st.setScrollTop(0);
      return;
    case "/mode": {
      const cfg = await getConfig();
      const next = cfg.aiProvider === "deepseek" ? "off" : "deepseek";
      await saveConfig({ aiProvider: next });
      setProvider(next === "deepseek" ? "DeepSeek" : "Offline");
      showToast(next === "deepseek" ? "AI mode: DeepSeek" : "AI mode: offline parser");
      return;
    }
    case "/account": {
      if (body === "off") {
        await saveConfig({ aiProvider: "off" });
        setProvider("Offline");
        showToast("AI mode: offline parser");
        return;
      }
      const cfg = await getConfig();
      if (cfg.aiProvider !== "deepseek") {
        showToast("AI is offline — use /mode to enable DeepSeek");
        return;
      }
      st.addMessage(createMessage("", "assistant", "checking DeepSeek account…"));
      st.setBusy(true);
      try {
        const name = (await getAiEngine().whoami()) ?? null;
        st.addMessage(
          createMessage(
            "",
            "assistant",
            name ? `DeepSeek signed in as **${name}**` : "DeepSeek not signed in. Run `juno auth` to sign in.",
          ),
        );
      } catch (err) {
        st.addMessage(createMessage("", "assistant", `account check failed: ${err instanceof Error ? err.message : String(err)}`));
      } finally {
        st.setBusy(false);
      }
      return;
    }
    case "/exit":
    case "/quit":
      process.exit(0);
      return;
    default:
      showToast(`unknown command: ${cmd} — try /help`);
  }
}

function getAiEngine(): AiEngineLike {
  if (!aiEngine) {
    aiEngine = new AiEngine(true);
  }
  return aiEngine;
}

function useElapsed(busy: boolean): number {
  const [el, setEl] = useState(0);
  useEffect(() => {
    if (!busy) {
      setEl(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => setEl(Date.now() - start), 200);
    return () => clearInterval(timer);
  }, [busy]);
  return el;
}

function heightsOf(messages: ChatMessage[], width: number): number[] {
  const w = Math.max(10, width - 6);
  return messages.map((m) => {
    let lines = 0;
    for (const raw of m.content.split("\n")) {
      lines += Math.max(1, Math.ceil(raw.length / w));
    }
    return lines + 2;
  });
}

function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    if (raw === "") {
      lines.push("");
      continue;
    }
    for (let i = 0; i < raw.length; i += width) lines.push(raw.slice(i, i + width));
  }
  return lines.length > 0 ? lines : [""];
}

function cursorPos(text: string, width: number, cursor: number): { line: number; col: number } {
  let remain = cursor;
  let line = 0;
  const lines = wrapText(text, width);
  for (let i = 0; i < lines.length; i++) {
    const len = (lines[i] ?? "").length + 1;
    if (remain < len) {
      line = i;
      break;
    }
    remain -= len;
  }
  if (remain < 0 || line >= lines.length) {
    line = Math.max(0, lines.length - 1);
    const last = lines[line];
    remain = last ? last.length : 0;
  }
  return { line: Math.max(0, line), col: remain };
}

type Theme = { juno: string; faint: string; toast: string };

const DARK: Theme = { juno: "#9ece6a", faint: "#6b7280", toast: "#e2b93d" };
const LIGHT: Theme = { juno: "#2e7d32", faint: "#9ca3af", toast: "#b45309" };
