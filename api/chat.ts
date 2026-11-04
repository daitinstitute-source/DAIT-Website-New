/**
 * POST /api/chat on Vercel, which is where the site actually deploys.
 *
 * Thin adapter, exactly like api/leads.ts: Vercel builds every file in this
 * top-level `api/` directory into its own serverless function, separately from
 * the Astro build, so the site stays `output: "static"`. The work lives in
 * src/lib/chat.ts, shared with the Cloudflare function in functions/api/chat.ts.
 *
 * The one real difference from leads: this streams. Vercel's Node runtime lets
 * us write SSE frames to `res` as they arrive, so the visitor sees the answer
 * being typed instead of staring at a spinner for several seconds.
 *
 * Env vars go in Vercel: Project > Settings > Environment Variables.
 * Needs ANTHROPIC_API_KEY plus everything the lead pipeline needs.
 */
import { streamChat, validateChat, type ChatRequest, type Env } from "../src/lib/chat.js";

/** Just enough of Vercel's Node handler signature to stay dependency-free. */
interface Req {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  write(chunk: Uint8Array | string): boolean;
  end(): void;
}

const header = (req: Req, name: string): string => {
  const v = req.headers?.[name];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
};

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // Same tolerance as the lead function: Vercel usually parses JSON, but hands
  // over a raw string when the content-type says otherwise.
  let body: ChatRequest | null = null;
  if (typeof req.body === "string") {
    try {
      body = JSON.parse(req.body) as ChatRequest;
    } catch {
      body = null;
    }
  } else if (req.body && typeof req.body === "object") {
    body = req.body as ChatRequest;
  }

  if (!body) {
    res.status(400).json({ ok: false, error: "Invalid JSON" });
    return;
  }

  const env = process.env as Env;
  // x-forwarded-for is the client chain on Vercel; first hop is the visitor.
  const ip = header(req, "x-forwarded-for").split(",")[0]?.trim() || "anon";

  const bad = validateChat(body, env, header(req, "origin"), ip);
  if (bad) {
    res.status(bad.status).json({ ok: false, error: bad.message });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Streaming through a proxy that buffers would defeat the point.
  res.setHeader("X-Accel-Buffering", "no");

  const stream = await streamChat(body, env);
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) res.write(value);
    }
  } finally {
    res.end();
  }
}
