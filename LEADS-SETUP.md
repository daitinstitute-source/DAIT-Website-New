# Lead pipeline + marketing automation — setup (Brevo)

Every form on the site POSTs to `/api/leads` (a Cloudflare Pages Function). Once the
Brevo env vars are set, each submission automatically:

1. **Emails you** the new lead (to `LEADS_TO_EMAIL`)
2. **Auto-replies** to the student — personalised ("Hi Amit, thanks for your interest in AI Digital Marketing…")
3. **Adds the contact to a Brevo list** with attributes (name, phone, program, audience) → **triggers your automation**
4. Optionally **forwards** the lead to `LEAD_WEBHOOK_URL` (e.g. a WhatsApp BSP)

Nothing fails the visitor if a provider is down — they always reach `/thank-you`.

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

(`FIRSTNAME` and `SMS` already exist.) These power personalisation **and let you see how engaged
each lead was** — a returning visitor who viewed 6 pages is a hotter lead than a 20-second bounce.

### 6. Add the env vars in Cloudflare Pages
Cloudflare dashboard → your Pages project → **Settings → Environment variables** (Production):

```
BREVO_API_KEY     = xkeysib-…
LEADS_TO_EMAIL    = admissions@daitinstitute.com
LEADS_FROM_EMAIL  = no-reply@daitinstitute.com
LEADS_FROM_NAME   = DAIT Institute
BREVO_LIST_ID     = 3
```
Redeploy after saving.

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
   npm run test:brevo -- you@example.com  # also sends the applicant auto-reply to you
   ```
3. It prints PASS/FAIL for each Brevo call. On success, check:
   - your `LEADS_TO_EMAIL` inbox got the **alert** email,
   - the address you passed got the **auto-reply**,
   - **Brevo → Contacts** shows the new test contact (in your list → automation triggered).

Common failures: wrong API key, **sender not verified** in Brevo, or a bad `BREVO_LIST_ID`.

### B. Testing the full browser form
`astro dev` does **not** run `/api/leads` (it's a Cloudflare Function, not an Astro route).
Cloudflare's local runner (`wrangler pages dev`) **cannot run on Windows ARM64** — its
`workerd` engine has no arm64 build. So to test the real on-page form end-to-end, push a
branch and use the **Cloudflare Pages preview deployment** (set the same env vars on the
Preview environment). Step A above already covers the Brevo side without deploying.

## Scaling later
- Outgrow Brevo's free tier? Upgrade Brevo, or move CRM to **Zoho** (India data-residency) — the `/api/leads` contract stays the same; only the provider call changes.
