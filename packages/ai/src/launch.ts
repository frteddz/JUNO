import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

export interface DeepSeekSession {
  context: BrowserContext;
  page: Page;
}

const REAL_CHROME_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function launchDeepSeek(opts: { headless: boolean; dataDir: string }): Promise<DeepSeekSession> {
  const sessionDir = join(opts.dataDir, "deepseek-session");
  await mkdir(sessionDir, { recursive: true });
  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: opts.headless,
    userAgent: REAL_CHROME_UA,
    viewport: { width: 1280, height: 800 },
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  await page.goto("https://chat.deepseek.com/", { waitUntil: "domcontentloaded" });
  return { context, page };
}