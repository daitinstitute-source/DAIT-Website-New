/**
 * POST /api/leads on Cloudflare Pages.
 *
 * A thin adapter: Cloudflare hands us a Request plus an env object, we hand back a
 * Response. The work itself lives in src/lib/leads.ts, shared with the Vercel
 * function in api/leads.ts and the dev bridge in astro.config.mjs.
 *
 * Kept even though the site currently deploys to Vercel, so that moving back to
 * Cloudflare Pages stays a hosting decision rather than a rewrite.
 */
import { handleLead, type Env, type LeadPayload } from "../../src/lib/leads";

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
  let lead: LeadPayload;
  try {
    lead = (await request.json()) as LeadPayload;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { status, body } = await handleLead(lead, env);
  return json(body, status);
};
