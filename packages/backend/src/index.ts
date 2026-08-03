export { buildServer, buildRoutes, startServer, type BackendOptions } from "./server.js";
export { generateToken, verifyToken, resolveToken } from "./auth.js";

export async function main(): Promise<void> {
  const { startServer } = await import("./server.js");
  const app = await startServer();
  const config = await import("@juno/core").then((c) => c.getConfig());
  app.log.info(`JUNO backend listening on http://${config.apiHost}:${config.apiPort}`);
  return new Promise((resolve) => {
    const shutdown = () => {
      app.close().finally(() => resolve());
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}