# CLAUDE.md — DAIT Institute Website Project Context

> This file is auto-read by Claude Code at the start of every session. It contains the full project context.
>
> **MANDATORY — Read before any design, page-creation, or copy work:**
> - `BRAND.md` — DAIT Institute brand guidelines (colors, typography, logo rules, component patterns). Never invent colors or fonts; everything comes from this file.
> - `DAIT-BUILD-SPEC.md` — definitive sitemap, page URLs, SEO keywords, and per-page section blueprints. All URLs must match this file exactly.

---

## Project Identity

**Site:** daitinstitute.com
**Legal Entity:** DAIT Institute — Dhakne's Digital AI & IT Training Institute
**Location:** Sambhaji Nagar, Maharashtra, India · info@daitinstitute.com
**What it is:** DAIT Institute's marketing + admissions website — an IT training institute offering career programs in Software Development, Data Science & AI, Cloud/DevOps/Security, and Digital Marketing / non-coding IT.
**Hosting:** Cloudflare Pages (`output: "static"` — pages are static; API routes use `export const prerender = false`)
**Primary CTA:** "Book Free Career Counselling" -> `/contact`
**Secondary CTA:** WhatsApp click-to-chat (floating button, site-wide)

---

## Target Audience (Critical — shapes ALL copy)

Two distinct audiences. Every program page and the homepage must speak to BOTH:

| Audience | What they want | Copy angle |
|---|---|---|
| **Fresh graduates** | First job, placement support, affordable fees, structured path | Career launch, placement stats, "from degree to job" |
| **Working professionals** | Upskilling, career switch, salary hike, flexible timings | Weekend/evening batches, learn-while-you-earn, ROI on fees |

**Copy rules:**
- Never write copy that assumes only students — always cover both audiences.
- Every program page states batch options for both (weekday full-time for grads, weekend/evening for professionals).
- Outcomes are concrete: job roles, tools mastered, certification names. No vague "become industry-ready" filler without specifics.

---

## Tech Stack (Final — Do Not Deviate)

| Layer | Tech | Notes |
|---|---|---|
| Framework | Astro 7 (spec said 6; npm resolved latest = 7 — same loader/@theme/vite-tailwind architecture) | `output: "static"`; per-route SSR opt-in via `export const prerender = false` |
| Styling | Tailwind v4 | `@tailwindcss/vite` plugin — NOT `@astrojs/tailwind` |
| Tokens | `src/styles/global.css` | ALL brand tokens in `@theme {}` — populated from BRAND.md |
| React | React 19 (islands only) | `client:load` / `client:visible` — nav dropdown, enquiry form, WhatsApp widget |
| Animation | GSAP + ScrollTrigger | Hero, scroll reveals, stat counters |
| Icons | astro-icon + Lucide + Simple Icons | Lucide for UI, Simple Icons for tech/tool logos (monochrome only) |
| Images | `astro:assets` (built-in) | `import { Image } from 'astro:assets'` |
| Search | astro-pagefind | Add when program count grows (Phase 3) |
| Forms / Leads | Native form -> `/api/leads` Cloudflare Function | Stores nothing on-page; emails the lead + POSTs to optional CRM webhook. See "Lead Pipeline" below |
| WhatsApp | Click-to-chat (`wa.me` link) | Floating button; WhatsApp Business API automation comes later via a BSP |
| Analytics | GA4 (+ Meta Pixel when ads start) | Free, integrates with Google Ads — institutes run paid campaigns |
| Fonts | @fontsource | Per BRAND.md — self-hosted, no Google Fonts CDN |
| Schema | schema-dts | JSON-LD: `EducationalOrganization`, `Course`, `FAQPage`, `BreadcrumbList` |
| SEO head | Native Astro `<head>` | Typed `SEOProps` in BaseLayout — do NOT use `astro-seo` package |

---

## Programs Architecture (Key difference from the Kansoft reference)

Programs are a **content collection** (MDX + Zod schema), NOT pure Astro pages. Reason: every program shares one layout and highly structured data (duration, fees, syllabus, batches) — a collection scales to 50+ programs without new code.

- Listing page: `/programs/` — groups programs by area, filter tabs per area
- Detail pages: `/programs/<program-slug>/` — dynamic route `src/pages/programs/[slug].astro` rendering `ProgramLayout.astro`
- **Areas are a data field, not a URL level** (keeps URLs short now; `/programs/<area>/` category pages can be added later without breaking anything)

**Program areas (enum in schema):**
1. `software-development` — full-stack, web, mobile
2. `data-ai` — data science, analytics, AI & ML
3. `cloud-devops-security` — AWS/Azure, DevOps, networking, cybersecurity
4. `digital-marketing` — digital marketing + non-coding IT tracks

**Program Zod schema** (`src/content.config.ts` — Astro 6 loader API):

```ts
const programs = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/programs" }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    area: z.enum(["software-development", "data-ai", "cloud-devops-security", "digital-marketing"]),
    duration: z.string(),               // "6 months"
    mode: z.array(z.enum(["classroom", "online", "hybrid"])),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    audience: z.array(z.enum(["graduates", "working-professionals"])),
    batchOptions: z.array(z.string()),  // ["Weekday (Mon-Fri)", "Weekend (Sat-Sun)"]
    fee: z.string().optional(),         // display string; omit to show "Contact for fees"
    nextBatchDate: z.coerce.date().optional(),
    highlights: z.array(z.string()),    // 4-6 bullets for cards
    tools: z.array(z.string()),         // tech/tool names — Simple Icons on detail page
    syllabus: z.array(z.object({ module: z.string(), topics: z.array(z.string()) })),
    outcomes: z.array(z.string()),      // concrete job roles / skills
    certification: z.string().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    featured: z.boolean().default(false), // shown on homepage
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});
```

Content collections are for: **programs**, and later **blog**, **testimonials/placements**, **faculty**.

---

## Lead Pipeline (built for future marketing automation)

Every lead flows through ONE standard shape so email/WhatsApp automation can plug in later without rebuilding forms:

```
Form (contact page / program page / popup)
  -> POST /api/leads  (Cloudflare Function, prerender = false)
      1. Validate + honeypot spam check
      2. Email the lead to LEADS_TO_EMAIL (via Resend or Brevo transactional API)
      3. If LEAD_WEBHOOK_URL is set -> forward JSON payload (future CRM/automation hook)
      4. Redirect to /thank-you
```

**Standard lead payload (do not change field names once live):**

```json
{
  "name": "", "email": "", "phone": "",
  "programInterest": "<program slug or 'general'>",
  "audienceType": "graduate | working-professional | other",
  "message": "",
  "source": "<page path>",
  "utm": { "source": "", "medium": "", "campaign": "" },
  "submittedAt": "<ISO date>"
}
```

**Future automation (Phase 5 — architecture decided now, tools chosen later):**
- Email sequences: Brevo (recommended — free tier, India-friendly) or Mailchimp
- WhatsApp automation: WhatsApp Business API via a BSP (AiSensy / Interakt / WATI) — the `LEAD_WEBHOOK_URL` hook feeds it
- The site NEVER talks to these tools directly from the browser — always through `/api/leads`

---

## Future Roadmap (guardrails so today's structure scales)

| Future feature | Architectural decision made NOW |
|---|---|
| Student & teacher login portals | **Separate app** at `portal.<domain>`. The marketing site stays static — do NOT add auth to this repo. Header reserves a "Student Login" link slot pointing to the portal subdomain. |
| Backend (batches, attendance, fees) | Lives with the portal app, not this repo. This repo's only server code is thin `/api/*` Cloudflare Functions. |
| Marketing automation | Already wired: standard lead payload + `LEAD_WEBHOOK_URL`. Choosing the BSP/email tool is a config change, not a rebuild. |
| Blog / SEO content | `src/content/blog/` collection — directory exists from day 1, pages added Phase 3. |
| Placements page, testimonials | `src/content/placements/` collection later; homepage testimonial section reads from it. |
| Multi-city / multi-center | `src/config/site.ts` holds a `centers` array from day 1 (even with one entry). |

---

## Brand Rules

ALL visual rules live in `BRAND.md` — read it before touching any UI. Non-negotiables that apply regardless of brand specifics:

- All brand tokens defined in `@theme {}` in `src/styles/global.css` — never hardcode hex values in components
- One accent color = interactive. If it's the accent color, it MUST be clickable (Kansoft-proven rule)
- Alternating dark/light section rhythm — max 2 consecutive dark, max 3 consecutive light
- Lucide icons: stroke 1.5px, outline only, min 16px. Simple Icons: monochrome only. Never emoji.
- Body text >= 12px. Max body content width `max-w-[680px]`.
- Cards float on a tinted page background — never pure white page background (adjust per BRAND.md palette)

---

## File Structure Map

```
src/
  config/site.ts          -> siteConfig: domain, contact info, centers[], WhatsApp number, social links
  layouts/
    BaseLayout.astro       -> HTML shell, SEO head, fonts, GA4, JSON-LD org schema
    ProgramLayout.astro    -> Extends BaseLayout + breadcrumbs, program hero, syllabus, batch info, enquiry CTA
  pages/
    index.astro            -> Homepage (9 sections — see DAIT-BUILD-SPEC.md)
    programs/
      index.astro          -> Programs hub (grouped by area, filter tabs)
      [slug].astro         -> Program detail (renders collection entry via ProgramLayout)
    contact.astro          -> Enquiry form + WhatsApp + center address/map + phone/email
    thank-you.astro        -> Post-submit page (conversion tracking fires here)
    404.astro
    api/leads.ts           -> Lead pipeline endpoint (prerender = false)
  components/
    layout/                -> Header, Footer, Breadcrumbs, MobileNav
    ui/                    -> Button, Card, Badge, SectionLabel
    sections/              -> Hero, ProgramCard, StatsBar, AudienceSplit, TestimonialStrip, CTABanner
    forms/                 -> EnquiryForm.tsx (island), WhatsAppButton
    seo/                   -> JsonLd
  content/
    programs/              -> MDX program entries (one file per program)
  content.config.ts        -> Zod schemas (Astro 6: src root, loader API)
  data/
    navigation.ts          -> Nav structure — change nav here, not in components
    seo-defaults.ts        -> Default meta + EducationalOrganization JSON-LD
  lib/
    seo.ts                 -> generateJsonLd(), canonical helpers
    gsap.ts                -> ScrollTrigger setup
  styles/
    global.css             -> @import "tailwindcss" + @theme tokens (from BRAND.md)
    animations.css         -> Reveal classes, View Transitions
public/
  images/logo/             -> DAIT logo SVG variants (from brand assets)
  images/programs/         -> Program hero/card images
  favicon.svg
```

---

## Environment Variables

All in `.env` (never committed), documented in `.env.example`:

```
LEADS_TO_EMAIL=                 # Where lead notifications are sent
RESEND_API_KEY=                 # Or BREVO_API_KEY — transactional email for lead alerts
LEAD_WEBHOOK_URL=               # Optional — future CRM/automation endpoint
PUBLIC_WHATSAPP_NUMBER=         # +91XXXXXXXXXX
PUBLIC_GA4_ID=                  # G-XXXXXXX
PUBLIC_SITE_URL=                # https://... (canonical URLs)
```

---

## Key Commands

```bash
npm run dev      # Dev server -> localhost:4321
npm run build    # Production build -> dist/
npm run preview  # Preview build locally
npx astro check  # TypeScript type check
```

**Folder-name rule:** the project folder path must contain NO spaces (a space/%20 in the path breaks Vite/React-island builds on Windows — verified on the Kansoft project).

---

## Navigation Structure

| Item | Type | Notes |
|---|---|---|
| Home | Link | `/` |
| Programs | Dropdown (4 areas) | Each area lists its programs from the collection |
| Why DAIT | Link (Phase 3) | Placeholder in nav data, hidden until page exists |
| Contact | Link | `/contact` |
| Student Login | Link slot (Phase 4) | Reserved in header — will point to `portal.<domain>` |
| **Book Free Career Counselling** | CTA button | Always visible, accent color |

All navigation defined in `src/data/navigation.ts`.

---

## Build Phases

**Phase 1 — Foundation** ✅ complete
- [x] Astro 7 + Tailwind v4 init, all deps installed
- [x] `global.css` with @theme tokens from BRAND.md
- [x] site.ts, navigation.ts, seo-defaults.ts, content.config.ts
- [x] BaseLayout with SEO head + JSON-LD (EducationalOrganization)
- [x] Header (with Programs dropdown), MobileNav, Footer, Button, Card, Badge, SectionLabel, Section, WhatsAppButton
- [x] Homepage (all 9 sections per BUILD-SPEC; founder story replaces invented stats)
- [x] `npm run build` + `npx astro check` clean (0 errors, 0 warnings)

Open `TODO:` markers for the client: Google Maps link for the centre, founder name + photo (`public/images/founder.jpg`), real social profile URLs, a purpose-built 1200×630 OG image, and real placement/testimonial content (Phase 3).

**Phase 2 — Programs & Contact**
- [ ] Programs collection schema + 4-8 seed program MDX entries (1-2 per area)
- [ ] Programs hub page + [slug] detail route + ProgramLayout
- [ ] Contact page + EnquiryForm island + `/api/leads` function + thank-you page
- [ ] Course JSON-LD on program pages

**Phase 3 — Content & SEO**
- [ ] Why DAIT / About page, blog collection + first posts, placements/testimonials
- [ ] Pagefind search, sitemap.xml, OG images

**Phase 4 — Portal (separate app)** — student/teacher login, batches, attendance
**Phase 5 — Marketing automation** — Brevo email sequences + WhatsApp BSP via lead webhook

---

## DO / DON'T Quick Reference

| DO | DON'T |
|---|---|
| Tokens from `@theme {}` (sourced from BRAND.md) | Hardcoded hex values in components |
| Programs as content collection MDX | Hand-built .astro page per program |
| All leads through `/api/leads` standard payload | Form tools talking to CRMs from the browser |
| Speak to graduates AND working professionals | Copy that assumes only students |
| Concrete outcomes (roles, tools, certs) | "Industry-ready" filler without specifics |
| `astro:assets` for images | `@astrojs/image` (deprecated) |
| Native `<head>` + SEOProps | `astro-seo` package |
| Lucide outline / Simple Icons monochrome | Filled icons, colored tech logos, emoji |
| Alternate dark/light sections | 3+ consecutive dark sections |
| Nav changes in `navigation.ts` | Nav hardcoded in Header component |
| Folder paths without spaces | Spaces/%20 in the repo path (breaks Windows builds) |
