/**
 * POST /api/chat on Cloudflare Pages.
 *
 * A thin adapter: Cloudflare hands us a Request plus an env object, we hand back
 * a Response. The work itself lives in src/lib/chat.ts, shared with the Vercel
 * function in api/chat.ts and the dev bridge in astro.config.mjs.
 *
 * Kept even though the site currently deploys to Vercel, so that moving back to
 * Cloudflare Pages stays a hosting decision rather than a rewrite. Streaming is
 * the easy half here — the lib already returns a web ReadableStream, which is
 * exactly what a Response wants.
 */
import { streamChat, validateChat, type ChatRequest, type Env } from "../../src/lib/chat.js";

interface Context {
  request: Request;
  env: Env;
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  // CF-Connecting-IP is Cloudflare's own, and unspoofable at the edge.
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";

  const bad = validateChat(body, env, request.headers.get("origin") ?? undefined, ip);
  if (bad) return json({ ok: false, error: bad.message }, bad.status);

  return new Response(await streamChat(body, env), {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
};
