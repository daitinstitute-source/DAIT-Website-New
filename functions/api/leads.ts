/**
 * POST /api/leads — Cloudflare Pages Function (lead pipeline, Brevo-powered).
 *
 * Deployed automatically by Cloudflare Pages from this `functions/` directory
 * (no Astro adapter needed; the site stays `output: "static"`). On each lead:
 *   1. Validate + honeypot spam check
 *   2. Notify the institute (transactional email to LEADS_TO_EMAIL)
 *   3. Upsert the contact into a Brevo list → triggers your nurture automation
 *   4. Create a Brevo CRM deal linked to that contact → the card you work in Deals
 *   5. Optionally forward the raw payload to LEAD_WEBHOOK_URL (e.g. a WhatsApp BSP)
 *   6. Return { ok: true } — the browser island then shows the thank-you popup
 *
 * NO auto-reply is sent to the enquirer — outbound mail goes to LEADS_TO_EMAIL only.
 *
 * All downstream steps are best-effort: a flaky provider never fails the user.
 * Field names in the payload are the CONTRACT — do not rename (see EnquiryForm.tsx).
 *
 * CONTACT IDENTITY: Brevo keys contacts by email, but our form only requires name +
 * phone. Phone-only leads are therefore keyed by `ext_id` = the E.164 phone, so every
 * lead lands in the CRM and repeat enquiries dedupe onto one contact.
 *
 * Required env (set in Cloudflare Pages → Settings → Environment variables):
 *   BREVO_API_KEY     — Brevo API v3 key
 *   LEADS_TO_EMAIL    — inbox that receives new-lead alerts
 *   LEADS_FROM_EMAIL  — verified Brevo sender (e.g. no-reply@daitinstitute.com)
 * Optional:
 *   LEADS_FROM_NAME   — sender display name (default "DAIT Institute")
 *   BREVO_LIST_ID     — list new leads join (the automation trigger)
 *   BREVO_PIPELINE_ID — CRM pipeline deals are created in (`npm run brevo:pipelines`)
 *   BREVO_STAGE_ID    — stage new deals land in (usually "New")
 *   LEAD_WEBHOOK_URL  — extra CRM / WhatsApp-BSP endpoint
 */

interface Env {
  BREVO_API_KEY?: string;
  LEADS_TO_EMAIL?: string;
  LEADS_FROM_EMAIL?: string;
  LEADS_FROM_NAME?: string;
  BREVO_LIST_ID?: string;
  BREVO_PIPELINE_ID?: string;
  BREVO_STAGE_ID?: string;
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
  /**
   * Free-form extra parameters passed per form instance (EnquiryForm `extraFields`).
   * Keys matching a Brevo contact attribute (UPPERCASED) are written as real,
   * filterable attributes; every key is also written into the deal notes, so a
   * param is never silently dropped just because the attribute doesn't exist yet.
   */
  extra?: Record<string, string | number | boolean>;
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

/**
 * Normalise an Indian phone to E.164 (+91...) so Brevo SMS/WhatsApp accepts it.
 * Returns "" for anything that isn't a plausible number: Brevo rejects the whole
 * contact on a malformed value, so a typo would cost us the entire lead record.
 */
function normalisePhone(raw = ""): string {
  const digits = raw.replace(/[^\d+]/g, "");
  const only = digits.replace(/\D/g, "");
  let e164 = "";
  if (digits.startsWith("+")) e164 = `+${only}`;
  else if (only.length === 10) e164 = `+91${only}`;
  else if (only.length === 12 && only.startsWith("91")) e164 = `+${only}`;
  else if (only) e164 = `+${only}`;
  return only.length >= 10 && only.length <= 15 ? e164 : "";
}

/**
 * Same guard for email. Visitors do type "asdf" into an optional email field, and
 * Brevo answers a malformed address with a 400 that kills the contact upsert - so
 * screen it here and fall back to keying the contact by phone instead.
 */
const isEmail = (s?: string): s is string => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((s ?? "").trim());

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
    ...Object.entries(lead.extra ?? {}).map(
      ([k, v]) => [k, String(v)] as [string, string],
    ),
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
    isEmail(lead.email) ? { email: lead.email, name: lead.name } : undefined,
  );
}

/**
 * Upsert the contact into Brevo (+ list) — the automation trigger, and the record
 * the CRM deal hangs off. Returns the Brevo contact id, or null on failure.
 *
 * Identity: email when we have one, otherwise `ext_id` = E.164 phone. Without this
 * fallback every phone-only lead (the compact form collects no email at all) would
 * be dropped here and never appear in the CRM.
 */
async function upsertContact(env: Env, lead: LeadPayload): Promise<number | null> {
  if (!env.BREVO_API_KEY) return null;

  const phone = normalisePhone(lead.phone);
  const email = isEmail(lead.email) ? lead.email.trim() : "";
  const identity = email ? { email } : phone ? { ext_id: phone } : null;
  if (!identity) return null; // no email and no usable phone — nothing to key on

  const attributes: Record<string, string | number | boolean> = {
    FIRSTNAME: firstName(lead.name),
    SMS: phone,
    WHATSAPP: phone,
    PROGRAM: lead.programInterest ?? "general",
    AUDIENCE: lead.audienceType ?? "",
    SOURCE: lead.source ?? "",
    LEAD_SOURCE: lead.leadSource ?? "Direct",
    LANDING_PAGE: lead.landingPage ?? "",
    PAGES_VIEWED: lead.pagesViewed ?? 1,
    TIME_ON_SITE: fmtDuration(lead.timeOnSiteSec),
    VISITOR: lead.visitor ?? "new",
  };
  // Extras become real attributes when the matching one exists in Brevo; unknown
  // keys are ignored by the API here but still captured in the deal notes below.
  for (const [k, v] of Object.entries(lead.extra ?? {})) {
    const key = k.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!(key in attributes)) attributes[key] = v;
  }

  const headers = {
    "api-key": env.BREVO_API_KEY,
    "content-type": "application/json",
    accept: "application/json",
  };
  const listIds = env.BREVO_LIST_ID ? { listIds: [Number(env.BREVO_LIST_ID)] } : {};

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...identity, updateEnabled: true, attributes, ...listIds }),
  });

  // Created → 201 with { id }. Already existed → 204 with no body, so look the id up.
  if (res.status === 201) {
    const body = (await res.json().catch(() => null)) as { id?: number } | null;
    if (body?.id) return body.id;
  }

  // Brevo refuses to put one phone on two contacts. That fires whenever someone
  // enquires twice under different identities → phone-only first, then with an email,
  // or two different emails. Without this branch the repeat lead gets NO contact at
  // all, so it never joins the list and the nurture automation never runs. Merge onto
  // the contact that already owns the phone instead, leaving SMS/WHATSAPP untouched.
  if (res.status === 400 && phone) {
    const err = (await res.json().catch(() => null)) as { code?: string } | null;
    if (err?.code !== "duplicate_parameter") return null;

    const byPhone = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(phone)}?identifierType=phone_id`,
      { headers },
    );
    if (!byPhone.ok) return null;
    const existing = (await byPhone.json().catch(() => null)) as { id?: number } | null;
    if (!existing?.id) return null;

    const merged: Record<string, string | number | boolean> = { ...attributes };
    delete merged.SMS;
    delete merged.WHATSAPP;
    await fetch(`https://api.brevo.com/v3/contacts/${existing.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ attributes: merged, ...listIds }),
    }).catch(() => null);
    return existing.id;
  }

  if (!res.ok && res.status !== 204) return null;

  const ident = email || phone;
  const look = await fetch(
    `https://api.brevo.com/v3/contacts/${encodeURIComponent(ident)}?identifierType=${email ? "email_id" : "ext_id"}`,
    { headers },
  );
  if (!look.ok) return null;
  const found = (await look.json().catch(() => null)) as { id?: number } | null;
  return found?.id ?? null;
}

/**
 * Create the CRM deal — this is what you actually work in Brevo → Deals.
 * Linked to the contact so calling/emailing from the card just works.
 * Pipeline/stage ids are sent when configured and dropped on a 400 — some
 * Brevo accounts treat them as read-only on create.
 */
async function createDeal(env: Env, lead: LeadPayload, contactId: number | null): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;
  const apiKey = env.BREVO_API_KEY;

  const extras = Object.entries(lead.extra ?? {}).map(([k, v]) => `${k}: ${v}`);
  const notes = [
    `Phone: ${normalisePhone(lead.phone) || "—"}`,
    `Email: ${lead.email || "—"}`,
    `Program: ${lead.programInterest ?? "general"}`,
    `Audience: ${lead.audienceType ?? "—"}`,
    `Message: ${lead.message || "—"}`,
    "",
    `Main source: ${lead.leadSource ?? "Direct"}`,
    `Landing page: ${lead.landingPage ?? "—"}`,
    `Converted on: ${lead.source ?? "—"}`,
    `Pages viewed: ${lead.pagesViewed ?? 1} · Time on site: ${fmtDuration(lead.timeOnSiteSec)}`,
    `Visitor: ${lead.visitor ?? "new"}${lead.visitNumber ? ` (visit #${lead.visitNumber})` : ""}`,
    `Referrer: ${lead.referrer || "—"}`,
    ...(extras.length ? ["", "— Extra —", ...extras] : []),
  ].join("\n");

  const post = (withPipeline: boolean) =>
    fetch("https://api.brevo.com/v3/crm/deals", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        name: `${lead.name ?? "Unknown"} — ${lead.programInterest ?? "general"}`,
        attributes: {
          ...(withPipeline && env.BREVO_PIPELINE_ID ? { pipeline: env.BREVO_PIPELINE_ID } : {}),
          ...(withPipeline && env.BREVO_STAGE_ID ? { deal_stage: env.BREVO_STAGE_ID } : {}),
          deal_description: notes,
        },
        ...(contactId ? { linkedContactsIds: [contactId] } : {}),
      }),
    });

  let res = await post(true);
  // Single-pipeline Brevo accounts treat `pipeline` / `deal_stage` as read-only on
  // create and reject the whole call with 400. Dropping them is safe: the deal then
  // defaults to the first stage ("New") of the only pipeline — exactly where a fresh
  // lead belongs. Accounts that do accept the ids keep honouring them.
  if (res.status === 400 && (env.BREVO_PIPELINE_ID || env.BREVO_STAGE_ID)) res = await post(false);
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
  // The CRM pair runs sequentially — a deal needs its contact's id to link to.
  const [notified, crm, forwarded] = await Promise.all([
    notifyInstitute(env, lead).catch(() => false),
    upsertContact(env, lead)
      .catch(() => null)
      .then(async (contactId) => ({
        contacted: contactId !== null,
        dealt: await createDeal(env, lead, contactId).catch(() => false),
      })),
    forwardWebhook(env, lead).catch(() => false),
  ]);

  if (!notified && !forwarded && !crm.contacted) {
    // Nothing delivered (local/dev or all failed) — keep a trace in the logs.
    console.log("[leads] captured (no delivery channel succeeded):", JSON.stringify(lead));
  }

  return json({ ok: true, notified, contacted: crm.contacted, dealt: crm.dealt, forwarded });
};
