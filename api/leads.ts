/**
 * POST /api/leads on Vercel, which is where the site actually deploys.
 *
 * Vercel builds every file in this top-level `api/` directory into a serverless
 * function on its own, separately from the Astro build. So the site stays
 * `output: "static"`, nothing about the existing deployment changes, and this is
 * purely additive. (Vercel never looks inside `functions/`, which is why the live
 * form used to 404 while the same code worked locally.)
 *
 * A thin adapter: Vercel passes a Node-style req/res pair and puts env vars on
 * process.env. The work lives in src/lib/leads.ts, shared with the Cloudflare
 * function in functions/api/leads.ts.
 *
 * Env vars must be set in the Vercel dashboard: Project > Settings >
 * Environment Variables. See LEADS-SETUP.md.
 */
import { handleLead, type Env, type LeadPayload } from "../src/lib/leads";

/** Just enough of Vercel's Node handler signature to stay dependency-free. */
interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // Vercel parses a JSON body for us, but hands over a raw string when the
  // content-type says otherwise, so accept both rather than dropping the lead.
  let lead: LeadPayload | null = null;
  if (typeof req.body === "string") {
    try {
      lead = JSON.parse(req.body) as LeadPayload;
    } catch {
      lead = null;
    }
  } else if (req.body && typeof req.body === "object") {
    lead = req.body as LeadPayload;
  }

  if (!lead) {
    res.status(400).json({ ok: false, error: "Invalid JSON" });
    return;
  }

  const { status, body } = await handleLead(lead, process.env as Env);
  res.status(status).json(body);
}
