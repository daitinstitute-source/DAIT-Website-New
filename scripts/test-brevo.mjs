/**
 * test-brevo.mjs — validate the Brevo lead-pipeline integration locally.
 *
 *   npm run test:brevo              → sends a sample lead to Brevo
 *   npm run test:brevo -- you@x.com → uses that address as the test lead's email
 *
 * Reads credentials from `.dev.vars` (copy `.dev.vars.example` → `.dev.vars`).
 * This mirrors the fetch calls in functions/api/leads.ts so you can confirm your
 * API key, verified sender and list all work WITHOUT deploying — needed because
 * Cloudflare's local runtime (workerd) doesn't run on Windows ARM64.
 *
 * It performs these real Brevo calls:
 *   1. Institute alert email    → LEADS_TO_EMAIL
 *   2. Contact upsert + list    → the automation trigger
 *   3. CRM deal for that lead   → the card you work in Brevo → Deals
 *   4. Phone-only lead          → proves ext_id keying (no email = still in the CRM)
 *
 * NO mail is ever sent to the enquirer - only you (LEADS_TO_EMAIL) receive email.
 */
import { loadEnv } from "./_env.mjs";

const env = loadEnv();
const applicantEmail = process.argv[2] || "";

// ---- helpers mirrored from functions/api/leads.ts ----
const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
const firstName = (name = "") => name.trim().split(/\s+/)[0] || "there";
function normalisePhone(raw = "") {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  const only = digits.replace(/\D/g, "");
  if (only.length === 10) return `+91${only}`;
  if (only.length === 12 && only.startsWith("91")) return `+${only}`;
  return only ? `+${only}` : "";
}
const FROM = () => ({
  email: env.LEADS_FROM_EMAIL || "no-reply@daitinstitute.com",
  name: env.LEADS_FROM_NAME || "DAIT Institute",
});

async function brevoEmail(to, subject, htmlContent, replyTo) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: FROM(), to: [to], subject, htmlContent, ...(replyTo ? { replyTo } : {}) }),
  });
  return res;
}

const HEADERS = () => ({
  "api-key": env.BREVO_API_KEY,
  "content-type": "application/json",
  accept: "application/json",
});

/** Mirrors upsertContact() in leads.ts — email-keyed, or ext_id for phone-only. */
async function upsertContact(lead) {
  const phone = normalisePhone(lead.phone);
  const identity = lead.email ? { email: lead.email } : { ext_id: phone };
  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: HEADERS(),
    body: JSON.stringify({
      ...identity,
      updateEnabled: true,
      attributes: {
        FIRSTNAME: firstName(lead.name),
        SMS: phone,
        WHATSAPP: phone,
        PROGRAM: lead.programInterest,
        AUDIENCE: lead.audienceType,
        SOURCE: lead.source,
        LEAD_SOURCE: lead.leadSource ?? "Direct",
        LANDING_PAGE: lead.landingPage ?? "",
        PAGES_VIEWED: lead.pagesViewed ?? 1,
        TIME_ON_SITE: lead.timeOnSite ?? "",
        VISITOR: lead.visitor ?? "new",
        ...(lead.extra ?? {}),
      },
      ...(env.BREVO_LIST_ID ? { listIds: [Number(env.BREVO_LIST_ID)] } : {}),
    }),
  });
  if (!res.ok && res.status !== 204) return { res, id: null };

  let id = null;
  if (res.status === 201) id = (await res.json().catch(() => ({})))?.id ?? null;
  if (!id) {
    const ident = lead.email ?? phone;
    const look = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(ident)}?identifierType=${lead.email ? "email_id" : "ext_id"}`,
      { headers: HEADERS() },
    );
    if (look.ok) id = (await look.json().catch(() => ({})))?.id ?? null;
  }
  return { res, id };
}

/** Mirrors createDeal() in leads.ts. */
async function createDeal(lead, contactId) {
  return fetch("https://api.brevo.com/v3/crm/deals", {
    method: "POST",
    headers: HEADERS(),
    body: JSON.stringify({
      name: `${lead.name} — ${lead.programInterest}`,
      attributes: {
        pipeline: env.BREVO_PIPELINE_ID,
        deal_stage: env.BREVO_STAGE_ID,
        deal_description: `Phone: ${normalisePhone(lead.phone)}\nEmail: ${lead.email || "—"}\nProgram: ${lead.programInterest}\n\n(Automated integration test — safe to delete.)`,
      },
      ...(contactId ? { linkedContactsIds: [contactId] } : {}),
    }),
  });
}

// ---- pretty logging ----
const c = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", d: "\x1b[2m", x: "\x1b[0m" };
const pass = (m) => console.log(`${c.g}  PASS${c.x} ${m}`);
const fail = (m) => console.log(`${c.r}  FAIL${c.x} ${m}`);
const skip = (m) => console.log(`${c.y}  SKIP${c.x} ${m}`);
async function bodyText(res) {
  try { return await res.text(); } catch { return ""; }
}

// ---- run ----
console.log(`\n${c.d}DAIT · Brevo integration test${c.x}\n`);

// Preflight: required vars present?
const missing = [];
if (!env.BREVO_API_KEY) missing.push("BREVO_API_KEY");
if (!env.LEADS_TO_EMAIL) missing.push("LEADS_TO_EMAIL");
if (!env.LEADS_FROM_EMAIL) missing.push("LEADS_FROM_EMAIL");
if (missing.length) {
  fail(`Missing in .dev.vars: ${missing.join(", ")}`);
  console.log(`\n${c.d}Copy .dev.vars.example → .dev.vars and fill it in. See LEADS-SETUP.md.${c.x}\n`);
  process.exit(1);
}
console.log(`${c.d}Sender:${c.x} ${FROM().name} <${FROM().email}>`);
console.log(`${c.d}Alert to:${c.x} ${env.LEADS_TO_EMAIL}`);
console.log(`${c.d}List ID:${c.x} ${env.BREVO_LIST_ID || "(none — contact upsert only, no automation trigger)"}\n`);

const lead = {
  name: "Test Lead",
  email: applicantEmail || `test+${Date.now()}@daitinstitute.com`,
  phone: "+91 90000 00000",
  programInterest: "ai-led-digital-marketing",
  audienceType: "graduate",
  message: "This is an automated integration test — safe to ignore.",
  source: "/programs/ai-led-digital-marketing",
  leadSource: "Google",
  landingPage: "/",
  pagesViewed: 4,
  timeOnSite: "3m 20s",
  visitor: "returning",
};

console.log(`${c.d}Pipeline:${c.x} ${env.BREVO_PIPELINE_ID || "(not set — deals will be skipped)"}\n`);

let ok = true;

// 1. Institute alert
try {
  const res = await brevoEmail(
    { email: env.LEADS_TO_EMAIL, name: "DAIT Admissions" },
    `TEST enquiry: ${lead.name} — ${lead.programInterest}`,
    `<p style="font-family:sans-serif">Brevo integration test — a real lead alert would look like this.</p>
     <p>Name: ${esc(lead.name)} · Phone: ${esc(lead.phone)} · Program: ${esc(lead.programInterest)}</p>`,
  );
  if (res.ok) pass(`Institute alert email sent → ${env.LEADS_TO_EMAIL}`);
  else { ok = false; fail(`Institute alert failed (HTTP ${res.status}) ${c.d}${await bodyText(res)}${c.x}`); }
} catch (e) { ok = false; fail(`Institute alert error: ${e.message}`); }

// 2. Contact upsert (+ list = automation trigger)
let contactId = null;
try {
  const { res, id } = await upsertContact(lead);
  contactId = id;
  if (res.ok || res.status === 204) {
    pass(`Contact upserted${env.BREVO_LIST_ID ? ` into list ${env.BREVO_LIST_ID} (automation will trigger)` : " (no list set)"}${id ? ` ${c.d}id=${id}${c.x}` : ""}`);
  } else {
    ok = false;
    fail(`Contact upsert failed (HTTP ${res.status}) ${c.d}${await bodyText(res)}${c.x}`);
  }
} catch (e) { ok = false; fail(`Contact upsert error: ${e.message}`); }

// 3. CRM deal — the card you actually work in Brevo → Deals
if (env.BREVO_PIPELINE_ID && env.BREVO_STAGE_ID) {
  try {
    const res = await createDeal(lead, contactId);
    if (res.ok) pass(`CRM deal created${contactId ? " and linked to the contact" : " (unlinked — no contact id)"}`);
    else { ok = false; fail(`Deal creation failed (HTTP ${res.status}) ${c.d}${await bodyText(res)}${c.x}`); }
  } catch (e) { ok = false; fail(`Deal creation error: ${e.message}`); }
} else {
  skip("CRM deal — set BREVO_PIPELINE_ID and BREVO_STAGE_ID (run: npm run brevo:pipelines)");
}

// 4. Phone-only lead — the case that used to vanish entirely
try {
  const phoneOnly = {
    ...lead,
    name: "Test PhoneOnly",
    email: "",
    phone: `+9190000${String(Date.now()).slice(-5)}`,
  };
  const { res, id } = await upsertContact(phoneOnly);
  if (res.ok || res.status === 204) {
    pass(`Phone-only contact created via ext_id ${c.d}${phoneOnly.phone}${c.x}`);
    if (env.BREVO_PIPELINE_ID && env.BREVO_STAGE_ID) {
      const d = await createDeal(phoneOnly, id);
      if (d.ok) pass("Phone-only lead also became a CRM deal");
      else { ok = false; fail(`Phone-only deal failed (HTTP ${d.status}) ${c.d}${await bodyText(d)}${c.x}`); }
    }
  } else {
    ok = false;
    fail(`Phone-only contact failed (HTTP ${res.status}) ${c.d}${await bodyText(res)}${c.x}`);
  }
} catch (e) { ok = false; fail(`Phone-only contact error: ${e.message}`); }

console.log("");
if (ok) {
  console.log(`${c.g}All Brevo calls succeeded.${c.x} Check ${env.LEADS_TO_EMAIL} for the alert, Brevo → Contacts for the test contacts, and Brevo → Deals for the test cards.\n`);
} else {
  console.log(`${c.r}Some calls failed.${c.x} Most common causes: wrong API key, sender not verified in Brevo, a bad LIST_ID, or pipeline/stage ids that don't match (run: npm run brevo:pipelines). See LEADS-SETUP.md.\n`);
  process.exit(1);
}
