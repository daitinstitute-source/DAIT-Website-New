/**
 * brevo-pipelines.mjs — print your Brevo CRM pipeline and stage IDs.
 *
 *   npm run brevo:pipelines
 *
 * Brevo's UI doesn't show these IDs anywhere, but `/api/leads` needs them to file
 * each lead as a deal. Run this after creating your pipeline in Brevo → Deals, then
 * copy the two values into `.dev.vars` and Cloudflare Pages env vars:
 *
 *   BREVO_PIPELINE_ID = <pipeline id>
 *   BREVO_STAGE_ID    = <id of the stage new leads should land in, usually "New">
 *
 * Reads BREVO_API_KEY from `.dev.vars` (or `.env`).
 */
import { loadEnv } from "./_env.mjs";

const env = loadEnv();
const c = { g: "\x1b[32m", r: "\x1b[31m", b: "\x1b[1m", d: "\x1b[2m", x: "\x1b[0m" };

if (!env.BREVO_API_KEY) {
  console.log(`${c.r}Missing BREVO_API_KEY${c.x} — copy .dev.vars.example → .dev.vars and fill it in.\n`);
  process.exit(1);
}

const res = await fetch("https://api.brevo.com/v3/crm/pipeline/details/all", {
  headers: { "api-key": env.BREVO_API_KEY, accept: "application/json" },
});

if (!res.ok) {
  console.log(`${c.r}Failed (HTTP ${res.status})${c.x} ${c.d}${await res.text().catch(() => "")}${c.x}`);
  console.log(`\n${c.d}If this is a 404, create a pipeline first: Brevo → Deals → Pipeline settings.${c.x}\n`);
  process.exit(1);
}

const data = await res.json();
const pipelines = Array.isArray(data) ? data : [data];

if (!pipelines.length) {
  console.log(`${c.r}No pipelines found.${c.x} Create one in Brevo → Deals → Pipeline settings.\n`);
  process.exit(1);
}

console.log(`\n${c.d}DAIT · Brevo CRM pipelines${c.x}\n`);
for (const p of pipelines) {
  console.log(`${c.b}${p.pipeline_name ?? "(unnamed)"}${c.x}`);
  console.log(`  ${c.d}BREVO_PIPELINE_ID =${c.x} ${c.g}${p.pipeline}${c.x}`);
  for (const s of p.stages ?? []) {
    console.log(`    ${c.d}stage${c.x} ${s.name.padEnd(22)} ${c.d}BREVO_STAGE_ID =${c.x} ${c.g}${s.id}${c.x}`);
  }
  console.log("");
}
console.log(`${c.d}Copy the pipeline id and your FIRST stage id into .dev.vars and Cloudflare Pages.${c.x}\n`);
