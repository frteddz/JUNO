import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import {
  getConfig,
  getStore,
  createMessage,
  createEventBus,
  parseCommand,
  describeIntent,
  getSystemInfo,
  type JunoEventBus,
  type Dispatcher,
} from "@juno/core";
import { generateToken } from "./auth.js";

export type BackendOptions = {
  eventBus?: JunoEventBus;
  dispatcher?: Dispatcher;
  port?: number;
  host?: string;
  dataDir?: string;
};

export function buildRoutes(app: FastifyInstance, opts: BackendOptions): void {
  const bus = opts.eventBus ?? createEventBus();
  const dispatcher = opts.dispatcher;

  app.get("/health", async () => ({ ok: true, app: "juno", time: new Date().toISOString() }));

  app.get("/api/config", async () => getConfig());
  app.get("/api/system", async () => ({ data: getSystemInfo() }));
  app.get("/api/token", async (req, reply) => {
    const expected = process.env.JUNO_API_TOKEN;
    if (expected) return reply.code(404).send({ error: "Token already set" });
    return { token: generateToken() };
  });

  app.post("/api/sessions", async () => {
    const store = getStore(opts.dataDir);
    const session = store.createSession();
    return session;
  });

  app.get("/api/sessions/:id/messages", async (req) => {
    const store = getStore(opts.dataDir);
    const { id } = req.params as { id: string };
    return { messages: store.messages(id) };
  });

  app.post("/api/command", async (req, reply) => {
    const body = req.body as { text?: string; sessionId?: string; path?: string };
    const text = (body.text ?? "").trim();
    if (!text) return reply.code(400).send({ error: "text is required" });
    const parsed = parseCommand(text);
    const store = getStore(opts.dataDir);
    const sessionId = body.sessionId ?? store.createSession().id;
    const userMsg = createMessage(sessionId, "user", text);
    store.addMessage(sessionId, userMsg);

    if (!parsed.ok) {
      const sysMsg = createMessage(sessionId, "system", parsed.error);
      store.addMessage(sessionId, sysMsg);
      return reply.code(400).send({ error: parsed.error, message: sysMsg });
    }

    let result;
    if (dispatcher && parsed.intent.intent !== "timer" && parsed.intent.intent !== "reminder") {
      try {
        result = await dispatcher(parsed.intent);
      } catch (err) {
        result = { ok: false, message: "Failed", error: err instanceof Error ? err.message : String(err) };
      }
    }
    if (!result) {
      result = {
        ok: true,
        message: `${describeIntent(parsed.intent)} queued`,
        data: { queued: true, intent: parsed.intent },
      };
      bus.emit("notify", { title: "Scheduled", body: describeIntent(parsed.intent), severity: "info" });
    }

    const assistantMsg = createMessage(sessionId, "assistant", result.message);
    store.addMessage(sessionId, assistantMsg);
    bus.emit("log.message", { message: assistantMsg, sessionId });
    return { message: result.message, ok: result.ok, data: result.data ?? null, intent: parsed.intent };
  });
}

export async function buildServer(opts: BackendOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  void app.register(cors, { origin: true });
  void app.register(websocket);
  buildRoutes(app, opts);
  return app;
}

export async function startServer(opts: BackendOptions = {}): Promise<FastifyInstance> {
  const config = await getConfig();
  const app = await buildServer(opts);
  const port = opts.port ?? config.apiPort;
  const host = opts.host ?? config.apiHost;
  await app.listen({ port, host });
  app.websocketServer?.on("connection", () => {
    // Keep-alive socket; core services publish via the event bus instead.
  });
  return app;
}