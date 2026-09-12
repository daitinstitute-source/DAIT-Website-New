/**
 * Shared .dev.vars / .env reader for the scripts in this folder.
 * KEY=value lines; ignores # comments, strips inline comments and quotes.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readFile(file) {
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, file), "utf8");
  } catch {
    return {};
  }
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].replace(/\s+#.*$/, "").trim(); // strip trailing inline comment
    val = val.replace(/^["']|["']$/g, ""); // strip surrounding quotes
    out[m[1]] = val;
  }
  return out;
}

/** Merged env: .dev.vars first, .env wins on conflict (same as the old inline loader). */
export function loadEnv() {
  return { ...readFile(".dev.vars"), ...readFile(".env") };
}
