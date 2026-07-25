/**
 * POST /api/leads — Cloudflare Pages Function (lead pipeline, Brevo-powered).
 *
 * Deployed automatically by Cloudflare Pages from this `functions/` directory
 * (no Astro adapter needed; the site stays `output: "static"`). On each lead:
 *   1. Validate + honeypot spam check
 *   2. Notify the institute (transactional email to LEADS_TO_EMAIL)
 *   3. Auto-reply to the student (personalised, if they gave an email)
 *   4. Upsert the contact into a Brevo list → triggers your nurture automation
 *   5. Optionally forward the raw payload to LEAD_WEBHOOK_URL (e.g. a WhatsApp BSP)
 *   6. Return { ok: true } — the browser island then routes to /thank-you
 *
 * All downstream steps are best-effort: a flaky provider never fails the user.
 * Field names in the payload are the CONTRACT — do not rename (see EnquiryForm.tsx).
 *
 * Required env (set in Cloudflare Pages → Settings → Environment variables):
 *   BREVO_API_KEY     — Brevo API v3 key
 *   LEADS_TO_EMAIL    — inbox that receives new-lead alerts
 *   LEADS_FROM_EMAIL  — verified Brevo sender (e.g. no-reply@daitinstitute.com)
 * Optional:
 *   LEADS_FROM_NAME   — sender display name (default "DAIT Institute")
 *   BREVO_LIST_ID     — list new leads join (the automation trigger)
 *   LEAD_WEBHOOK_URL  — extra CRM / WhatsApp-BSP endpoint
 */

interface Env {
  BREVO_API_KEY?: string;
  LEADS_TO_EMAIL?: string;
  LEADS_FROM_EMAIL?: string;
  LEADS_FROM_NAME?: string;
  BREVO_LIST_ID?: string;
  LEAD_WEBHOOK_URL?: string;
}

interface Context {
  request: Request;
  env: Env;
}

interface LeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  programInterest?: string;
  audienceType?: string;
  message?: string;
  company?: string; // honeypot
  source?: string; // page the form was submitted on (conversion page)
  // First-party engagement (from the BaseLayout session tracker):
  leadSource?: string; // main source: Direct / Google / Facebook / Referral: … / WhatsApp
  landingPage?: string; // first page of the session
  pagesViewed?: number; // pages viewed this session before converting
  timeOnSiteSec?: number; // seconds on site before converting
  visitor?: string; // "new" | "returning"
  visitNumber?: number; // which visit this is
  referrer?: string;
  submittedAt?: string;
}

/** "3m 20s" from seconds. */
const fmtDuration = (sec = 0): string => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

const esc = (s: string): string =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);

const firstName = (name = "") => name.trim().split(/\s+/)[0] || "there";

/** Normalise an Indian phone to E.164 (+91…) so Brevo SMS/WhatsApp accepts it. */
function normalisePhone(raw = ""): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  const only = digits.replace(/\D/g, "");
  if (only.length === 10) return `+91${only}`;
  if (only.length === 12 && only.startsWith("91")) return `+${only}`;
  return only ? `+${only}` : "";
}

const FROM = (env: Env) => ({
  email: env.LEADS_FROM_EMAIL || "no-reply@daitinstitute.com",
  name: env.LEADS_FROM_NAME || "DAIT Institute",
});

/** Send a transactional email via Brevo. */
async function brevoEmail(
  env: Env,
  to: { email: string; name?: string },
  subject: string,
  htmlContent: string,
  replyTo?: { email: string; name?: string },
): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: FROM(env), to: [to], subject, htmlContent, ...(replyTo ? { replyTo } : {}) }),
  });
  return res.ok;
}

/** New-lead alert to the institute. */
async function notifyInstitute(env: Env, lead: LeadPayload): Promise<boolean> {
  if (!env.LEADS_TO_EMAIL) return false;
  const rows: Array<[string, string]> = [
    ["Name", lead.name ?? ""],
    ["Phone", lead.phone ?? ""],
    ["Email", lead.email ?? "—"],
    ["Program", lead.programInterest ?? "general"],
    ["Audience", lead.audienceType ?? ""],
    ["Message", lead.message ?? "—"],
    ["Main source", lead.leadSource ?? "Direct"],
    ["Landing page", lead.landingPage ?? "—"],
    ["Converted on", lead.source ?? "—"],
    ["Pages viewed", String(lead.pagesViewed ?? 1)],
    ["Time on site", fmtDuration(lead.timeOnSiteSec)],
    ["Visitor", `${lead.visitor ?? "new"}${lead.visitNumber ? ` · visit #${lead.visitNumber}` : ""}`],
    ["Referrer", lead.referrer || "—"],
    ["Submitted", lead.submittedAt ?? ""],
  ];
  const html = `
    <h2 style="font-family:sans-serif">New DAIT enquiry — ${esc(lead.programInterest ?? "general")}</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows
        .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666"><b>${esc(k)}</b></td><td style="padding:6px 12px">${esc(String(v))}</td></tr>`)
        .join("")}
    </table>`;
  return brevoEmail(
    env,
    { email: env.LEADS_TO_EMAIL, name: "DAIT Admissions" },
    `New enquiry: ${lead.name ?? "Unknown"} — ${lead.programInterest ?? "general"}`,
    html,
    lead.email ? { email: lead.email, name: lead.name } : undefined,
  );
}

/** Personalised acknowledgement to the student. */
async function autoReply(env: Env, lead: LeadPayload): Promise<boolean> {
  if (!lead.email) return false;
  const html = `
    <div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
      <p>Hi ${esc(firstName(lead.name))},</p>
      <p>Thanks for your interest in <b>${esc(lead.programInterest ?? "our programs")}</b> at DAIT Institute.
      We've received your enquiry and a counsellor will call you at <b>${esc(lead.phone ?? "")}</b> shortly.</p>
      <p>In the meantime, you can explore our programs or reach us on WhatsApp any time.</p>
      <p>Warm regards,<br/>Team DAIT · A Dhakne Education Group Institute</p>
    </div>`;
  return brevoEmail(env, { email: lead.email, name: lead.name }, "We've received your enquiry — DAIT Institute", html);
}

/** Upsert the contact into Brevo (+ list) — this is the automation trigger. */
async function upsertContact(env: Env, lead: LeadPayload): Promise<boolean> {
  if (!env.BREVO_API_KEY || !lead.email) return false; // Brevo keys contacts by email
  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      email: lead.email,
      updateEnabled: true,
      attributes: {
        FIRSTNAME: firstName(lead.name),
        SMS: normalisePhone(lead.phone),
        WHATSAPP: normalisePhone(lead.phone),
        PROGRAM: lead.programInterest ?? "general",
        AUDIENCE: lead.audienceType ?? "",
        SOURCE: lead.source ?? "",
        LEAD_SOURCE: lead.leadSource ?? "Direct",
        LANDING_PAGE: lead.landingPage ?? "",
        PAGES_VIEWED: lead.pagesViewed ?? 1,
        TIME_ON_SITE: fmtDuration(lead.timeOnSiteSec),
        VISITOR: lead.visitor ?? "new",
      },
      ...(env.BREVO_LIST_ID ? { listIds: [Number(env.BREVO_LIST_ID)] } : {}),
    }),
  });
  return res.ok;
}

async function forwardWebhook(env: Env, lead: LeadPayload): Promise<boolean> {
  if (!env.LEAD_WEBHOOK_URL) return false;
  const res = await fetch(env.LEAD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lead),
  });
  return res.ok;
}

export const onRequestPost = async (context: Context): Promise<Response> => {
  const { request, env } = context;

  let lead: LeadPayload;
  try {
    lead = (await request.json()) as LeadPayload;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  // Honeypot: bots fill "company". Pretend success so they don't retry.
  if (lead.company && lead.company.trim() !== "") return json({ ok: true });

  // Minimal validation — name + phone are the must-haves.
  if (!lead.name?.trim() || !lead.phone?.trim()) {
    return json({ ok: false, error: "Name and phone are required." }, 422);
  }

  // Fan out; never fail the user if a downstream is flaky.
  const [notified, replied, contacted, forwarded] = await Promise.all([
    notifyInstitute(env, lead).catch(() => false),
    autoReply(env, lead).catch(() => false),
    upsertContact(env, lead).catch(() => false),
    forwardWebhook(env, lead).catch(() => false),
  ]);

  if (!notified && !forwarded) {
    // Nothing delivered (local/dev or all failed) — keep a trace in the logs.
    console.log("[leads] captured (no delivery channel succeeded):", JSON.stringify(lead));
  }

  return json({ ok: true, notified, replied, contacted, forwarded });
};
