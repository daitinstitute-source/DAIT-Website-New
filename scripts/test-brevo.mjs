/**
 * test-brevo.mjs — validate the Brevo lead-pipeline integration locally.
 *
 *   npm run test:brevo              → sends a sample lead to Brevo
 *   npm run test:brevo -- you@x.com → also auto-replies to that address
 *
 * Reads credentials from `.dev.vars` (copy `.dev.vars.example` → `.dev.vars`).
 * This mirrors the fetch calls in functions/api/leads.ts so you can confirm your
 * API key, verified sender and list all work WITHOUT deploying — needed because
 * Cloudflare's local runtime (workerd) doesn't run on Windows ARM64.
 *
 * It performs three real Brevo calls:
 *   1. Institute alert email   → LEADS_TO_EMAIL
 *   2. Applicant auto-reply    → the email you pass as an arg (optional)
 *   3. Contact upsert + list   → the automation trigger
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---- tiny .dev.vars parser (KEY=value lines, ignores # comments) ----
function loadEnv(file) {
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

const env = { ...loadEnv(".dev.vars"), ...loadEnv(".env") };
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

async function upsertContact(lead) {
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
        PROGRAM: lead.programInterest,
        AUDIENCE: lead.audienceType,
        SOURCE: lead.source,
        LEAD_SOURCE: lead.leadSource ?? "Direct",
        LANDING_PAGE: lead.landingPage ?? "",
        PAGES_VIEWED: lead.pagesViewed ?? 1,
        TIME_ON_SITE: lead.timeOnSite ?? "",
        VISITOR: lead.visitor ?? "new",
      },
      ...(env.BREVO_LIST_ID ? { listIds: [Number(env.BREVO_LIST_ID)] } : {}),
    }),
  });
  return res;
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

// 2. Applicant auto-reply (only if you passed a real address)
if (applicantEmail) {
  try {
    const res = await brevoEmail(
      { email: applicantEmail, name: lead.name },
      "We've received your enquiry — DAIT Institute (TEST)",
      `<p style="font-family:sans-serif">Hi ${esc(firstName(lead.name))}, this is the auto-reply your applicants will get.</p>`,
    );
    if (res.ok) pass(`Auto-reply sent → ${applicantEmail}`);
    else { ok = false; fail(`Auto-reply failed (HTTP ${res.status}) ${c.d}${await bodyText(res)}${c.x}`); }
  } catch (e) { ok = false; fail(`Auto-reply error: ${e.message}`); }
} else {
  skip("Auto-reply — pass an email to test it:  npm run test:brevo -- you@example.com");
}

// 3. Contact upsert (+ list = automation trigger)
try {
  const res = await upsertContact(lead);
  if (res.ok) {
    pass(`Contact upserted${env.BREVO_LIST_ID ? ` into list ${env.BREVO_LIST_ID} (automation will trigger)` : " (no list set)"}`);
  } else {
    ok = false;
    fail(`Contact upsert failed (HTTP ${res.status}) ${c.d}${await bodyText(res)}${c.x}`);
  }
} catch (e) { ok = false; fail(`Contact upsert error: ${e.message}`); }

console.log("");
if (ok) {
  console.log(`${c.g}All Brevo calls succeeded.${c.x} Check ${env.LEADS_TO_EMAIL} for the alert${applicantEmail ? `, ${applicantEmail} for the auto-reply` : ""}, and Brevo → Contacts for the test contact.\n`);
} else {
  console.log(`${c.r}Some calls failed.${c.x} Most common causes: wrong API key, sender not verified in Brevo, or a bad LIST_ID. See LEADS-SETUP.md.\n`);
  process.exit(1);
}
