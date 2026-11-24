/**
 * GET /api/brochure?t=<token>&lang=en|mr — the gated brochure download.
 *
 * The PDFs are no longer in public/. They live in assets/brochures/, which the
 * static build never publishes, and this is the only way to reach them. A
 * token comes from /api/leads and is only minted once a lead has been filed,
 * so there is no path to the file that does not leave you a contact.
 *
 * Vercel bundles the PDFs with this function via the `functions.includeFiles`
 * entry in vercel.json — without it the files are simply absent at runtime and
 * every download 404s.
 *
 * No equivalent exists in functions/api/ for Cloudflare: Workers have no
 * filesystem, so the same job needs an assets or R2 binding there. The token
 * half of this lives in src/lib/brochure.ts and is already host-neutral, so
 * only the file read would need writing.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  verifyBrochureToken,
  brochureSecret,
  BROCHURE_FILES,
  BROCHURE_FILENAMES,
  type BrochureLang,
} from "../src/lib/brochure.js";

interface Req {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  send(body: unknown): void;
}

const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method && req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // Vercel parses `query`, but fall back to the raw URL so a local or changed
  // runtime does not silently break the gate.
  let token = one(req.query?.t);
  let lang = one(req.query?.lang);
  if (!token && req.url) {
    const q = new URL(req.url, "http://localhost").searchParams;
    token = q.get("t") ?? "";
    lang = q.get("lang") ?? lang;
  }

  const secret = brochureSecret(process.env as Record<string, string | undefined>);
  const check = await verifyBrochureToken(token, secret);

  if (!check.ok) {
    // Deliberately vague to the visitor; the reason is for our logs only.
    console.log(`[brochure] denied (${check.reason})`);
    res.status(403).json({
      ok: false,
      error: "This download link has expired. Please request the brochure again.",
    });
    return;
  }

  // The language is taken from the SIGNED token, never from the query string —
  // otherwise ?lang= would be a free file-selection parameter.
  const chosen: BrochureLang = check.lang ?? (lang === "mr" ? "mr" : "en");

  let pdf: Buffer;
  try {
    pdf = readFileSync(join(process.cwd(), BROCHURE_FILES[chosen]));
  } catch (err) {
    console.error("[brochure] file missing:", BROCHURE_FILES[chosen], err);
    res.status(500).json({ ok: false, error: "Brochure is unavailable right now." });
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${BROCHURE_FILENAMES[chosen]}"`);
  res.setHeader("Content-Length", String(pdf.length));
  // Never cached by a CDN or a shared proxy: the URL carries a credential.
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.status(200).send(pdf);
}
