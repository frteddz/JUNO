import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

export type FileEntry = {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "other";
  size: number;
};

function entryType(name: string, isDir: boolean, isLink: boolean): FileEntry["type"] {
  if (isLink) return "symlink";
  if (isDir) return "dir";
  return "file";
}

export async function listDir(target: string): Promise<FileEntry[]> {
  const dir = resolve(target);
  const dirents = await readdir(dir, { withFileTypes: true });
  const entries: FileEntry[] = [];
  for (const d of dirents.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  })) {
    let size = 0;
    if (d.isFile()) {
      const { stat } = await import("node:fs/promises");
      try {
        size = (await stat(join(dir, d.name))).size;
      } catch {
        size = 0;
      }
    }
    entries.push({ name: d.name, path: join(dir, d.name), type: entryType(d.name, d.isDirectory(), d.isSymbolicLink()), size });
  }
  return entries;
}

export async function readTextFile(target: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return readFile(resolve(target), "utf8");
}

export async function searchFiles(root: string, query: string): Promise<string[]> {
  const base = resolve(root);
  const hits: string[] = [];
  const boxes = query
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0 && p !== "etc" && p !== "and etc");
  const stack = [base];
  let visited = 0;
  const MAX = 2000;
  while (stack.length && visited < MAX) {
    const dir = stack.pop()!;
    let dirents: import("node:fs").Dirent[];
    try {
      dirents = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const d of dirents) {
      visited++;
      if (visited > MAX) break;
      const full = join(dir, d.name);
      if (d.name.startsWith(".") || d.name === "node_modules") continue;
      if (d.isDirectory()) {
        stack.push(full);
      } else if (boxes.some((b) => d.name.toLowerCase().includes(b))) {
        hits.push(full);
      }
    }
  }
  return hits;
}