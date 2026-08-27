# Lead pipeline + CRM — setup (Brevo)

Every form on the site POSTs to `/api/leads` (a Cloudflare Pages Function). Once the
Brevo env vars are set, each submission automatically:

1. **Emails you** the new lead (to `LEADS_TO_EMAIL`)
2. **Adds the contact to a Brevo list** with attributes (name, phone, program, audience) → **triggers your automation**
3. **Creates a CRM deal** in your Brevo pipeline, linked to that contact — this is the card you work in **Brevo → Deals**
4. Optionally **forwards** the lead to `LEAD_WEBHOOK_URL` (e.g. a WhatsApp BSP)

Nothing fails the visitor if a provider is down — they always see the thank-you popup.

**No mail is sent to the enquirer.** Outbound email goes only to `LEADS_TO_EMAIL`.

**Contact identity:** Brevo normally keys contacts by email, but our forms only require
name + phone (the compact "Book a visit" form collects no email at all). Phone-only leads
are therefore keyed by `ext_id` = the phone in `+91…` format. Every lead reaches the CRM,
and a repeat enquirer dedupes onto one contact instead of creating a second.

---

## One-time setup (~20 min)

### 1. Create a free Brevo account
[brevo.com](https://www.brevo.com) → free plan (300 emails/day, unlimited contacts).

### 2. Verify your sender
Brevo → **Senders, Domains & Dedicated IPs** → add & **authenticate `daitinstitute.com`** (add the SPF/DKIM DNS records Brevo gives you). This is what keeps emails out of spam. Your `LEADS_FROM_EMAIL` (e.g. `no-reply@daitinstitute.com`) must be on this domain.

### 3. Get the API key
Brevo → **SMTP & API → API Keys** → *Generate a new key* → copy → this is `BREVO_API_KEY`.

### 4. Create the leads list
Brevo → **Contacts → Lists** → *Add a list* ("Website Leads") → open it → note the **List ID** (a number) → this is `BREVO_LIST_ID`.

### 5. Create custom contact attributes
Brevo → **Contacts → Settings → Contact attributes** → add these:

| Attribute | Type | What it holds |
|---|---|---|
| `PROGRAM` | Text | Program / ICP the lead chose |
| `AUDIENCE` | Text | graduate / working-professional / other |
| `SOURCE` | Text | Page the form was submitted on |
| `WHATSAPP` | Text | Phone in +91 format |
| `LEAD_SOURCE` | Text | Main source: Direct / Google / Facebook / Referral / WhatsApp |
| `LANDING_PAGE` | Text | First page of their visit |
| `PAGES_VIEWED` | Number | Pages viewed before enquiring |
| `TIME_ON_SITE` | Text | e.g. "3m 20s" |
| `VISITOR` | Text | new / returning |
| `FORM` | Text | Which form produced the lead, e.g. "Program page footer" |

(`FIRSTNAME` and `SMS` already exist.) These power personalisation **and let you see how engaged
each lead was** — a returning visitor who viewed 6 pages is a hotter lead than a 20-second bounce.

### 6. Create the CRM pipeline (this is where you'll see and work leads)

Brevo → **Deals → Pipeline settings** → create a pipeline named **Admissions** with stages:

```
New → Contacted → Counselling Booked → Visited → Enrolled → Lost
```

Brevo doesn't show pipeline/stage IDs anywhere in the UI, so fetch them:

```bash
npm run brevo:pipelines
```

It prints the `BREVO_PIPELINE_ID` and a `BREVO_STAGE_ID` for each stage. Use the **first
stage** ("New") — that's where new enquiries land.

### 7. Add the env vars in Cloudflare Pages
Cloudflare dashboard → your Pages project → **Settings → Environment variables** (Production):

```
BREVO_API_KEY     = xkeysib-…
LEADS_TO_EMAIL    = admissions@daitinstitute.com
LEADS_FROM_EMAIL  = no-reply@daitinstitute.com
LEADS_FROM_NAME   = DAIT Institute
BREVO_LIST_ID     = 3
BREVO_PIPELINE_ID = …          # from npm run brevo:pipelines
BREVO_STAGE_ID    = …          # the "New" stage
```
Redeploy after saving.

> If `BREVO_PIPELINE_ID` / `BREVO_STAGE_ID` are missing, everything else still works —
> deals are just skipped, and leads appear only under **Contacts**.

---

## Working leads day to day

Brevo → **Deals** → your Admissions pipeline. Each card is one enquiry:

- **Card title** — `Priya Sharma — ai-led-digital-marketing`
- **Description** — phone, email, program, audience, their message, plus how engaged they
  were (main source, landing page, pages viewed, time on site, new/returning). A returning
  visitor who read 6 pages is a hotter lead than a 20-second bounce — call them first.
- **Linked contact** — click through to call, WhatsApp, or email them.
- **Drag the card** between stages as the enquiry progresses.

---

## Which form did the lead come from?

Every `EnquiryForm` takes a `formId` and always sends it as `extra.form`. The page path
alone is not enough: a program page carries two forms, and knowing whether someone filled
the hero form or scrolled to the bottom one tells you how much convincing they needed.

| Where | `formId` |
|---|---|
| Homepage hero | `Home hero` |
| Contact page | `Contact page` |
| For Colleges page | `For Colleges page` |
| Program page, top form | `Program hero` |
| Program page, bottom form | `Program page footer` |

A form added without a `formId` reports `unlabelled` rather than nothing, so it shows up
in Brevo as an obvious gap to fix.

## Sending extra parameters with a form

Any form can attach extra data via the `extraFields` prop — useful for campaign tags,
which counsellor owns a landing page, a specific batch, and so on:

```astro
<EnquiryForm
  client:load
  programSlug="ai-led-digital-marketing"
  extraFields={{ campaign: "diwali-2026", counsellor: "rahul", batch: "weekend" }}
/>
```

Each extra param lands in **three** places:

1. The **new-lead alert email** — always, as an extra row
2. The **deal description** in the CRM — always, under an "— Extra — " heading
3. The **contact record** as a real, filterable attribute — *only if* you first create a
   matching contact attribute in Brevo (**Contacts → Settings → Contact attributes**),
   named in UPPERCASE: `campaign` → `CAMPAIGN`

So you can add a param today and see it immediately in the email and deal notes; create the
Brevo attribute later if you want to segment or filter on it. Nothing is ever silently lost.

---

## Personalised automation (built in Brevo's UI)

Brevo → **Automations → Create a workflow**:

- **Entry trigger:** *A contact is added to a list* → **Website Leads**
- **Then** (example nurture):
  1. **Send email** — welcome. Personalise with merge tags: `Hi {{contact.FIRSTNAME}}`, "…about **{{contact.PROGRAM}}**".
  2. **Wait** 1 day → **Send email** — "here's what you'll learn + a student's day".
  3. **Wait** 2 days → **Send email** — "book your free counselling call" (link to `/contact/`).
  4. **Wait** 3 days → **Send email** — batch-starting reminder.
- **Personalise by audience:** add an *If/Else* on `{{contact.AUDIENCE}}` = `graduate` vs `working-professional` and send different copy (placement-focused vs upskill/salary-focused).

That's your personalised marketing automation — running automatically for every lead.

---

## WhatsApp automation (add later, no rebuild)

India's #1 channel. Pick a low-cost BSP — **AiSensy** or **Interakt** — get their inbound
webhook URL, and set it as `LEAD_WEBHOOK_URL` in Cloudflare. Each lead is then also pushed
to WhatsApp, where you run a template welcome + follow-up flow. (Brevo also has a WhatsApp
channel if you prefer to stay in one tool.)

---

## Testing

### A. Validate the Brevo integration locally (recommended first step)
No deploy needed — this proves your API key, verified sender and list all work.

1. `cp .dev.vars.example .dev.vars` and fill in the same values you'll use in production.
2. Run one of:
   ```bash
   npm run test:brevo                     # institute alert + contact upsert
   npm run test:brevo -- you@example.com  # uses that address as the test lead's email
   ```
3. It prints PASS/FAIL for each Brevo call. On success, check:
   - your `LEADS_TO_EMAIL` inbox got the **alert** email,
   - **Brevo → Contacts** shows the new test contact (in your list → automation triggered),
   - **Brevo → Deals** shows two test cards — one normal lead and one **phone-only** lead
     (proving the `ext_id` path works). Delete both after checking.

Common failures: wrong API key, **sender not verified** in Brevo, a bad `BREVO_LIST_ID`, or
pipeline/stage ids that don't match — re-run `npm run brevo:pipelines` to confirm those.

### B. Testing the full browser form

`npm run dev` runs it. `/api/leads` is a Cloudflare Function, which the Astro dev server
would normally ignore — so the forms used to 404 locally. A dev-only Vite plugin in
`astro.config.mjs` now runs that exact function inside the dev server, reading credentials
from `.dev.vars`. Fill any form on `localhost:4321`, hit submit, and watch the terminal:

```
[leads] 200 {"ok":true,"notified":true,"contacted":true,"dealt":true,"forwarded":false}
```

`contacted:true` — Brevo → Contacts. `dealt:true` — Brevo → Deals. Editing `.dev.vars`
needs no restart; the file is re-read on every submission. Production is unaffected — the
plugin is `apply: "serve"` and Cloudflare keeps running the function from `functions/`.

---

## Thank-you popup & conversion tracking

Submitting a form now opens a **popup** instead of navigating to `/thank-you/` — the
visitor keeps their place on the page. The page still exists as a standalone URL; it's
just no longer part of the submit flow.

Conversion events fire from the popup, in `EnquiryForm.tsx` → `trackConversion()`:

| Event | Channel | Notes |
|---|---|---|
| `generate_lead` | `dataLayer` (GTM) | GA4 lives inside GTM here, so this is the real one |
| `Lead` | Meta Pixel | Only when `PUBLIC_META_PIXEL_ID` is set |

**You must add a GA4 tag in GTM** to turn the `dataLayer` push into a GA4 conversion:
GTM → **Triggers** → new *Custom Event* trigger named `generate_lead` → **Tags** → new
*GA4 Event* tag (event name `generate_lead`) using that trigger → **Publish**. Then mark it
as a conversion in GA4 → Admin → Events.

> Previously the event was on `/thank-you/` gated behind `siteConfig.analytics.ga4Id`,
> which is intentionally blank because GA4 is delivered via GTM — so it never actually
> fired. The `dataLayer` push replaces it.

---

## Scaling later
- Outgrow Brevo's free tier? Upgrade Brevo, or move CRM to **Zoho** (India data-residency) — the `/api/leads` contract stays the same; only the provider call changes.
