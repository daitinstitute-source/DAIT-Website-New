# DAIT-BUILD-SPEC.md — Sitemap & Page Blueprints

> Definitive URL structure and per-page section blueprints. All page URLs must match this file exactly. SEO title/description placeholders should be filled with your city + program keywords (e.g. "Full Stack Development Course in [City] | DAIT Institute").

---

## Sitemap

### Live in Phase 1-2

| URL | Page | Priority |
|---|---|---|
| `/` | Homepage | P0 |
| `/programs/` | Programs hub (all programs, grouped/filterable by area) | P0 |
| `/programs/<program-slug>/` | Program detail — one per program (content collection) | P0 |
| `/contact/` | Contact / Enquiry | P0 |
| `/thank-you/` | Post-form-submit (conversion tracking) | P0 |
| `/404` | Not found | P0 |

### Seed programs (Phase 2 — 1-2 per area to start; add freely later)

| Slug (proposed — edit) | Area |
|---|---|
| `full-stack-development` | software-development |
| `mobile-app-development` | software-development |
| `data-science-and-ai` | data-ai |
| `data-analytics` | data-ai |
| `cloud-and-devops` | cloud-devops-security |
| `cybersecurity` | cloud-devops-security |
| `digital-marketing` | digital-marketing |

### Phase 3+ (reserve URLs, do not build yet)

| URL | Page |
|---|---|
| `/why-dait/` | About / differentiators / faculty |
| `/placements/` | Placement stats + success stories |
| `/blog/` + `/blog/<slug>/` | SEO content |
| `/admissions/` | Process, eligibility, fees, EMI |
| `portal.<domain>` | Student/teacher portal (SEPARATE app — never under this domain's routes) |

---

## Homepage Blueprint (9 sections, alternating dark/light)

| # | Section | Bg | Content |
|---|---|---|---|
| 1 | **Hero** | DARK | Headline speaking to both audiences (e.g. "Launch or Level-Up Your IT Career"), subhead, primary CTA "Book Free Career Counselling", secondary ghost CTA "Explore Programs", 3 hero stats (students trained, placement rate, hiring partners — use real numbers or omit) |
| 2 | **Trust bar** | LIGHT | Hiring-partner / student-company logos (monochrome) OR accreditation badges. If none yet: stat strip instead |
| 3 | **Program areas** | LIGHT | 4 cards (the 4 areas) — each links to `/programs/` filtered; icon badge + 2-line description + program count |
| 4 | **Why DAIT + stats** | DARK | 3-4 differentiators with GSAP counter stats (mentors, hours of labs, batches/year) |
| 5 | **Featured programs** | LIGHT | Cards from collection where `featured: true` — title, duration, mode, next batch, CTA |
| 6 | **Audience split** | LIGHT | Two-path section: "Just Graduated?" vs "Working Professional?" — each with tailored pitch + relevant programs link |
| 7 | **Testimonials / placements** | DARK | 2-3 student success quotes (placeholder content marked clearly if real ones not available yet) |
| 8 | **Upcoming batches CTA** | LIGHT | Next batch dates table from collection + enquiry CTA |
| 9 | **Final CTA + Footer** | DARK | "Not sure which program fits? Talk to a counsellor — free." + footer |

**Footer:** logo, tagline, program links (by area), quick links, center address(es), phone, email, WhatsApp, social icons, hours.

---

## Programs Hub Blueprint (`/programs/`)

1. Compact hero (DARK) — title, one-line value prop, breadcrumbs
2. Filter tabs (sticky) — All | Software Development | Data & AI | Cloud, DevOps & Security | Digital Marketing
3. Program cards grid (LIGHT) — per card: area badge, title, tagline, duration, mode icons, level, next batch date, "View Program" CTA
4. Audience-split strip — same two-path component as homepage section 6
5. CTA banner — counselling CTA

## Program Detail Blueprint (`/programs/[slug]` via ProgramLayout)

1. Hero (DARK) — breadcrumbs, area overline, title, tagline, key-facts row (duration / mode / level / next batch), CTA + WhatsApp
2. Highlights (LIGHT) — the `highlights[]` bullets as icon cards
3. Who is this for (LIGHT) — renders `audience[]` + `batchOptions[]` as the two-audience section
4. Syllabus (DARK or LIGHT per rhythm) — accordion of `syllabus[]` modules
5. Tools you'll master — `tools[]` as monochrome Simple Icons row
6. Outcomes + certification (LIGHT) — `outcomes[]` list + certification badge
7. FAQs — `faqs[]` accordion + FAQPage JSON-LD
8. Enquiry CTA banner — form pre-filled with `programInterest: <slug>`
9. **JSON-LD:** `Course` schema on every program page

---

## Contact Page Blueprint (`/contact/`)

1. Compact hero (DARK) — "Talk to a Career Counsellor" + reassurance line (free, no obligation)
2. Two-column (LIGHT):
   - **Left — EnquiryForm island:** name, email, phone, "I am a..." (graduate / working professional / other), program interest (dropdown from collection), message, honeypot field — POST `/api/leads`
   - **Right — direct channels:** WhatsApp CTA card, phone (click-to-call), email, center address card(s) with Google Maps embed/link, office hours
3. FAQ strip — 4-5 common admission questions
4. `EducationalOrganization` + `ContactPoint` JSON-LD

---

## SEO Defaults

- Title pattern: `<Page/Program Title> | DAIT Institute` (program pages: include city keyword)
- Every page: canonical URL, OG title/description/image, `EducationalOrganization` org schema site-wide via BaseLayout
- Program pages add `Course` schema; contact adds `ContactPoint`; FAQs add `FAQPage`
- `robots.txt` + sitemap generated at build

---

## Fill These Placeholders Before/During Phase 1

- [ ] Domain name (site.ts, canonical URLs, .env `PUBLIC_SITE_URL`)
- [ ] Institute legal name, center address(es), phone, email, hours (site.ts `centers[]`)
- [ ] WhatsApp number (.env)
- [ ] Real program list — confirm/edit the seed slugs table above
- [ ] Real stats for homepage (students trained, placement %, partners) — or omit the stat, never invent numbers
- [ ] Hiring partner / accreditation logos — or use the stat-strip fallback in section 2
