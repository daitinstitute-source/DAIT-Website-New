# BRAND.md — DAIT Institute Brand Guidelines

> Source: **DAIT Institute Brand Guidelines 2025 (v1.0)** + **DAIT_web_logos_v2** logo pack (regenerated from EPS vector masters). This file maps 1:1 to the `@theme {}` tokens in `src/styles/global.css`.
>
> **Colour source of truth:** the HTML Brand Guidelines 2025. The logo pack README lists marginally different values (Blue `#124CA1`, Orange `#F16422`); if exact logo-art colour matching is ever required, reconcile there. Tokens below follow the HTML guide.

---

## 1. Logo

Assets live in `public/images/logo/` (SVG = use everywhere; PNGs are `-300w`/`-600w`/`-1200w` and `-240w`/`-480w`/`-960w` fallbacks). Favicons live in `public/` root.

| Asset | File | Usage |
|---|---|---|
| Horizontal — light bg | `/images/logo/dait-logo-horizontal-light.svg` | **Header/navbar on white/light backgrounds** (default). |
| Horizontal — dark bg | `/images/logo/dait-logo-horizontal-dark.svg` | Header/navbar on DAIT Blue / dark navy sections (reversed). |
| Stacked — light bg | `/images/logo/dait-logo-stacked-light.svg` | Footer, social profile, square placements on light. |
| Stacked — dark bg | `/images/logo/dait-logo-stacked-dark.svg` | Footer/social on dark. |
| Icon mark | `/images/logo/dait-icon-master.png` | The "D" mark only, when full wordmark won't fit. |
| Favicon (classic) | `/favicon.ico` | Browser tab (16/32/48 bundled). |
| Favicon PNGs | `/favicon-16x16.png`, `-32x32`, `-48x48`, `-64x64`, `-180x180`, `-192x192`, `-512x512` | Standard, Apple touch, Android/PWA. |

**Logo rules:**
- Clear space around the logo = the height of the "D". No text/graphics inside that zone.
- Minimum on-screen logo width **120px**; favicon mark **32×32**.
- Approved backgrounds: White · Off-white (`#F8FAFF`) · DAIT Blue · Dark navy · Light grey. **Never** place the logo on the orange, or on busy photos without a solid colour overlay.
- Never recolour, rotate, skew, stretch, add shadows/gradients/outlines, or retype the wordmark. Use the SVGs (text is outlined — no font dependency).
- Use `-light` variant (dark-coloured logo) on light backgrounds; `-dark` variant (reversed logo) on dark backgrounds.

---

## 2. Color Palette

> **Two-colour brand system** (per the Guidelines' 60/10/25/5 ratio): DAIT Blue dominates (~60%), Orange is the highlight/accent (~10%), white cards ~25%, grey ~5%. Blue is the primary brand + primary-CTA colour; Orange is the accent used for key highlights and secondary CTAs. Both are interactive-only where used as buttons/links — never colour non-interactive text with them except the approved decorative highlight role (e.g. one highlighted word in a heading).

| Role | Token name | Hex | Usage |
|---|---|---|---|
| **Accent / primary CTA** | `accent-500` | `#1548A3` | DAIT Blue — primary buttons, links, primary interactive |
| Accent hover | `accent-600` | `#0E3480` | Hover / pressed (Deep Blue) |
| Accent tint | `accent-50` | `#E8EFFE` | Icon-badge backgrounds, chips, subtle highlights (Light Blue) |
| **Secondary / highlight** | `orange-500` | `#F26321` | DAIT Orange — accent CTAs, highlighted heading word, attention |
| Secondary hover | `orange-600` | `#D94E10` | Orange hover |
| Secondary tint | `orange-50` | `#FDE8DC` | Orange tint backgrounds |
| Extra accent (sparingly) | `cyan-400` | `#00C6FF` | Cyan — hero animation/gradient highlights only, never as a CTA |
| **Dark base** | `dark-950` | `#0D1117` | Dark section backgrounds, hero (Near Black) |
| Dark elevated | `dark-850` | `#0E3480` | Cards/panels on dark sections (Deep Blue) |
| **Page background** | `surface-50` | `#F8FAFF` | Page background (tinted off-white — NOT pure white) |
| Section alt background | `surface-75` | `#FFFFFF` | White — cards, and alternating light sections vs `surface-50` |
| Text primary | `ink-900` | `#0D1117` | Headings on light |
| Text secondary | `ink-600` | `#1F2937` | Body on light |
| Text muted | `ink-500` | `#6B7280` | Captions, labels, metadata |
| Text light | `ink-400` | `#9CA3AF` | Placeholders, disabled |
| Text on dark | — | `rgba(255,255,255,.9)` heading / `rgba(255,255,255,.65)` body | Text on dark sections |
| Border | `border` | `#E5E7EB` | Dividers, card borders |
| Border blue | `border-blue` | `#BFCFEF` | Blue-tinted borders |

**Additional brand colors:** Cyan `#00C6FF` is decorative only (hero gradient/animation) — never a button or link. Orange is the single permitted "second" interactive colour and must otherwise stay in its highlight/accent role.

---

## 3. Typography

Self-hosted via `@fontsource` (no Google CDN).

| Role | Font | Weights | Notes |
|---|---|---|---|
| Headings | **Poppins** | 700 SemiBold, 800 Bold, 900 ExtraBold | `@fontsource/poppins` |
| Body | **Poppins** | 400 Regular, 500 Medium, 600 SemiBold | Body ≥ 14px on screen; ≥ 1.5× line-height |
| Code / numbers | **DM Mono** | 400, 500 | `@fontsource/dm-mono` — stats, code, specs |

**Type scale (from the Guidelines):**
- H1 / hero: `clamp(2rem, 5vw, 3.5rem)`, weight 900, line-height 1.1, letter-spacing -1.5px
- H2: `clamp(1.6rem, 3vw, 2.25rem)`, weight 800, tracking -1px
- H3: `clamp(1.2rem, 2vw, 1.5rem)`, weight 700
- Body: 1rem / 1.75, weight 400, colour `#1F2937`
- Small/caption: 0.8125rem / 1.6, weight 500, colour `#6B7280`
- Label/overline: 0.72rem, weight 700, uppercase, tracking 1.5–2px

**Typography rules:** Max 2 typefaces per layout. Bold (700) for all CTAs. Never all-caps body text, never a body weight lighter than 400.

---

## 4. Voice & Tone — "Authoritative expertise, honestly scaled"

DAIT should read like a **serious, modern tech institute** (the confident, outcome-first register of Scaler / upGrad / NIIT) — but our authority comes from **real proof, never invented scale**. We are new; we do not claim placement counts, "6,000+ transitions," "#1", or "hiring partners" we don't have. Instead, authority is carried by: an **IIM-Raipur-trained, 10+ yr practitioner founder**, a **25-year family education legacy** in Sambhaji Nagar, an **AI-first, industry-aligned curriculum**, and **concrete outcomes** (roles, tools, certifications, portfolios).

### Six principles
1. **Lead with the outcome, name the proof.** Roles, tools, certifications, portfolios — never "industry-ready" without specifics.
2. **Speak as a practitioner, not a promoter.** Authority = doing the work: live projects, current tools, mentor-led cohorts. Confident, declarative sentences; active voice.
3. **Precision over hype.** Concrete nouns + strong verbs; cut adjectives and filler.
4. **Signal rigor.** Emphasize the *system* — structured tracks, methodology, mentorship, capstones — the way leading institutes signal seriousness.
5. **AI-native & forward-looking.** Teach "the tools companies hire for today"; position students for how work is changing.
6. **Warm authority.** Professional and credible, but human — the family/local trust story is the moat, not a liability.

### Word palette
- **Use:** master, build, ship, industry-aligned, mentor-led, hands-on, cohort, portfolio, outcomes, roles, certifications, current tools, structured, rigorous, practitioners, career.
- **Avoid (banned):** world-class, best, #1, guaranteed, "industry-ready" (alone), unleash, empower, revolutionary, exclamation marks in body copy, and any scale/placement number we can't prove.

### House style
- "Cohort" (not "batch") where tone matters; "career advisor" is fine alongside "counselling."
- Headings: white/ink + ONE orange keyword (see §2). Lead the keyword with the outcome.
- Body ≤ 3 short sentences per block; one clear CTA per section.

### Before → after (reference)
- ❌ "Job-ready training for AI, tech & digital careers" → ✅ "Master in-demand skills in AI, software, data & digital."
- ❌ "Become a job-ready digital marketer…" → ✅ "Master performance marketing, SEO, analytics and AI-driven growth on the exact tools agencies use — and graduate with a portfolio of live campaigns."
- ❌ "What makes us different" → ✅ "How we train differently."

**Tone by channel:** Website — confident, precise, outcome-first, short paragraphs. Social — punchy, real student/industry wins. Email — personal, one clear CTA. In-person — warm, honest, zero-pressure.

---

## 5. Imagery & Illustration

Real photos of the institute/students preferred over stock. Lucide outline icons (stroke 1.5px) for UI; Simple Icons monochrome for tech/tool logos. **No emoji anywhere.** Logo never on busy photos without a solid colour overlay.

---

## 6. Component Feel

- Corner radius: `--radius-sm` 4px, `--radius` 8px (default buttons/inputs), `--radius-lg` 14px (cards), `--radius-xl` 20px, full 9999px (pills/badges).
- Shadows (blue-tinted): sm `0 1px 3px rgba(21,72,163,.08)`, md `0 4px 16px rgba(21,72,163,.10)`, lg `0 12px 40px rgba(21,72,163,.13)`.
- Cards: white on tinted (`#F8FAFF`) page background, 1px `#E5E7EB` border, soft shadow, `rounded-[14px]`, hover lift `translateY(-2px)` + `shadow-lg`.
- Buttons: Bold 700, `rounded-lg`, hover `translateY(-1px)` + coloured shadow. Primary = DAIT Blue; secondary = Orange; outline = blue border; ghost = grey border.
- Transitions `all .25s cubic-bezier(.4,0,.2,1)`. GSAP fade-up reveals respecting `prefers-reduced-motion`.
- Section rhythm: alternate dark/light, max 2 consecutive dark. Max body content width `max-w-[680px]`; page container `max-w-[1100px]`.
