import type { Page } from "playwright";
import { SEL } from "./selectors.js";
import { sleep, jitter } from "./chat.js";

export const MD_OF_FN = String(function mdOfTree(root: HTMLElement): string {
  function inline(node: Node): string {
    let s = "";
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        s += child.textContent ?? "";
        continue;
      }
      if (child.nodeType !== 1) continue;
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      switch (tag) {
        case "strong":
        case "b":
          s += "**" + inline(el) + "**";
          break;
        case "em":
        case "i":
          s += "*" + inline(el) + "*";
          break;
        case "del":
        case "s":
          s += "~~" + inline(el) + "~~";
          break;
        case "code":
          s += "`" + (el.textContent ?? "") + "`";
          break;
        case "a":
          s += "[" + inline(el) + "](" + (el.getAttribute("href") ?? "") + ")";
          break;
        case "br":
          s += "\n";
          break;
        case "img": {
          const src = el.getAttribute("src") ?? "";
          if (src) s += "![" + (el.getAttribute("alt") ?? "") + "](" + src + ")";
          break;
        }
        default:
          s += inline(el);
      }
    }
    return s;
  }

  function list(el: HTMLElement, ordered: boolean, depth: number): string {
    let s = "";
    const pad = "  ".repeat(depth);
    for (const li of Array.from(el.children)) {
      if (li.tagName.toLowerCase() !== "li") continue;
      const box = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      const marker = box ? (box.checked ? "- [x]" : "- [ ]") : ordered ? "1." : "-";
      let head = "";
      let sub = "";
      for (const c of li.childNodes) {
        if (c.nodeType === 3) {
          head += c.textContent ?? "";
          continue;
        }
        if (c.nodeType !== 1) continue;
        const t = (c as HTMLElement).tagName.toLowerCase();
        if (t === "ul" || t === "ol") sub += list(c as HTMLElement, t === "ol", depth + 1);
        else head += inline(c);
      }
      head = head.replace(/\s+/g, " ").trim();
      if (head) s += pad + marker + " " + head + "\n";
      if (sub) s += sub;
    }
    return s;
  }

  function codeblock(el: HTMLElement): string {
    const code = el.querySelector("code");
    const cls = code ? code.getAttribute("class") ?? "" : "";
    let lang = "";
    const m = cls.match(/language-([\w+#.+-]+)/i) || cls.match(/lang-([\w+#.+-]+)/i);
    if (m) lang = m[1] ?? "";
    const text = (code ?? el).textContent ?? "";
    return "```" + lang + "\n" + text.replace(/\n+$/, "") + "\n```";
  }

  function table(el: HTMLElement): string {
    const rows: string[][] = [];
    el.querySelectorAll("tr").forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("th, td").forEach((c) => cells.push(inline(c).replace(/\s+/g, " ").trim()));
      if (cells.length) rows.push(cells);
    });
    if (rows.length === 0) return "";
    const n = Math.max(...rows.map((r) => r.length));
    const head = rows[0] ?? [];
    let s = "| " + head.concat(Array(Math.max(0, n - head.length)).fill("")).join(" | ") + " |\n";
    s += "| " + Array(n).fill("---").join(" | ") + " |\n";
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? [];
      s += "| " + row.concat(Array(Math.max(0, n - row.length)).fill("")).join(" | ") + " |\n";
    }
    return s;
  }

  function blocks(el: Node): string {
    const parts: string[] = [];
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const t = (child.textContent ?? "").replace(/\s+/g, " ").trim();
        if (t) parts.push(t);
        continue;
      }
      if (child.nodeType !== 1) continue;
      const h = child as HTMLElement;
      const tag = h.tagName.toLowerCase();
      let part = "";
      if (/^h[1-6]$/.test(tag)) {
        if (h.textContent && h.textContent.trim()) part = "#".repeat(Number(tag[1])) + " " + inline(h).trim();
      } else {
        switch (tag) {
          case "p":
            if (h.textContent && h.textContent.trim()) part = inline(h).trim();
            break;
          case "pre":
            part = codeblock(h);
            break;
          case "blockquote":
            part = blocks(h)
              .trim()
              .split("\n")
              .map((l) => "> " + l)
              .join("\n");
            break;
          case "ul":
            part = list(h, false, 0);
            break;
          case "ol":
            part = list(h, true, 0);
            break;
          case "table":
            part = table(h);
            break;
          case "hr":
            part = "---";
            break;
          default: {
            const r = blocks(h).trim();
            if (r) part = r;
          }
        }
      }
      if (part) parts.push(part.trim());
    }
    return parts.join("\n\n");
  }

  return blocks(root);
});

export async function readMessages(page: Page): Promise<string[]> {
  try {
    return await page.evaluate(
      ([sels, fn]) => {
        const mdOf = Function('"use strict";return (' + fn + ")")() as (el: HTMLElement) => string;
        for (const sel of sels) {
          const els = Array.from(document.querySelectorAll(sel));
          if (els.length > 0) {
            const kept: Element[] = [];
            for (const e of els) {
              if (kept.some((k) => k.contains(e))) continue;
              kept.push(e);
            }
            return kept
              .map((e) => mdOf(e as HTMLElement).trim())
              .filter(Boolean);
          }
        }
        return [];
      },
      [[SEL.markdown, '[class*="markdown"]', '[class*="message"] [class*="content"], [class*="chat-bubble"]'], MD_OF_FN] as const,
    );
  } catch {
    return [];
  }
}

async function composer(page: Page) {
  return page.locator(SEL.composer).first();
}

export async function sendPrompt(page: Page, prompt: string): Promise<void> {
  const input = await composer(page);
  await input.click({ timeout: 8000 });
  await sleep(jitter(100, 250));
  await page.keyboard.insertText(prompt);
  await sleep(jitter(100, 250));
  await input.press("Enter", { timeout: 8000 });
}

export async function streamReply(
  page: Page,
  onChunk: (chunk: { text: string; done: boolean }) => void,
  timeoutMs = 180000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const anchor = (await readMessages(page)).length;
  let lastText = "";
  let stable = 0;
  while (Date.now() < deadline) {
    await sleep(250);
    const msgs = await readMessages(page);
    const tail = msgs.slice(anchor);
    const text = tail.join("\n\n");
    if (text !== lastText) {
      lastText = text;
      stable = 0;
      if (text !== "") onChunk({ text, done: false });
    } else if (text !== "") {
      stable++;
      if (stable >= 8) {
        onChunk({ text, done: true });
        return text;
      }
    }
  }
  if (lastText !== "") {
    onChunk({ text: lastText, done: true });
    return lastText;
  }
  throw new Error("Timed out waiting for DeepSeek to reply.");
}