import type { Page } from "playwright";
import { SEL } from "./selectors.js";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min));
}

export async function dismissBanners(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    let handled = false;
    const btn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /start chat|get started|continue|got it|accept|agree|知道了|开始|同意|跳过/i })
      .first();
    if (await btn.count().catch(() => 0)) {
      await btn.click({ force: true, timeout: 5000 }).catch(() => {});
      handled = true;
    }
    if (!handled) break;
    await sleep(1500);
  }
}

export async function waitForReady(page: Page, timeoutMs = 60000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isComposerVisible(page)) return;
    await sleep(500);
  }
  throw new Error("Timed out waiting for DeepSeek chat to load (chat.deepseek.com).");
}

export async function isComposerVisible(page: Page): Promise<boolean> {
  try {
    const el = page.locator(SEL.composer).first();
    if (await el.count()) return await el.isVisible().catch(() => false);
  } catch {
    /* keep polling */
  }
  return false;
}

const SIGN_IN_SELECTORS = [
  'a[href*="sign_in"], a[href*="sign-in"]',
  'button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login"), button:has-text("登录")',
  '[data-testid*="sign-in"], [class*="sign-in"], [class*="login"]',
];

export async function isSignInVisible(page: Page): Promise<boolean> {
  try {
    for (const sel of SIGN_IN_SELECTORS) {
      const el = page.locator(sel).first();
      if (await el.count().catch(() => 0)) {
        if (await el.isVisible().catch(() => false)) return true;
      }
    }
  } catch {
    /* keep polling */
  }
  return false;
}

export async function detectSignedIn(page: Page): Promise<boolean> {
  if (!(await isComposerVisible(page))) return false;
  return !(await isSignInVisible(page));
}

export async function waitForAuthState(
  page: Page,
  timeoutMs = 30000,
): Promise<"signed-in" | "signed-out"> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isComposerVisible(page)) return "signed-in";
    if (await isSignInVisible(page)) return "signed-out";
    await sleep(500);
  }
  return "signed-out";
}

export async function waitForSignedIn(page: Page, timeoutMs = 300000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await detectSignedIn(page)) return;
    await sleep(500);
  }
  throw new Error("Timed out waiting for you to sign in to DeepSeek in the browser.");
}

export async function detectServerBusy(page: Page): Promise<boolean> {
  try {
    const busy = page.locator("text=/server is busy|busy now|too many requests|try again later/i").first();
    return await busy.isVisible().catch(() => false);
  } catch {
    return false;
  }
}

export async function getSignedInAccount(page: Page): Promise<string | null> {
  try {
    const email = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const re = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
      const seen = new Set<string>();
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const m = re.exec(n.textContent ?? "");
        if (!m || seen.has(m[0])) continue;
        seen.add(m[0]);
        const r = n.parentElement?.getBoundingClientRect();
        if (r && r.width > 0 && r.height > 0) return m[0];
      }
      return null;
    });
    if (email) return email;
  } catch {
    /* best-effort */
  }
  return null;
}

export { jitter };
