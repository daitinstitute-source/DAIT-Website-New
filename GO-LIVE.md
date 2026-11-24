# GO-LIVE checklist — flipping daitinstitute.com public

The site is **deliberately blocked from Google and every other crawler** until
the owner gives the green signal. The blocks live in four separate places, on
purpose — but that means four switches, and missing one either leaves the site
invisible or lets it leak out early.

This file is the single list. Nothing else needs to change for indexing.

---

## 1. The four indexing blocks

Work down the list. Each row says exactly what to change and how to prove it.

| # | File | Change | Why it exists |
|---|---|---|---|
| 1 | `public/robots.txt` | Replace the whole file with the "LIVE version" commented at its bottom | Stops crawling outright — the strongest block |
| 2 | `src/config/site.ts` | `allowIndexing: false` -> `true` | Drops the `noindex` meta from all pages. **Also turns GTM/GA4 on** |
| 3 | `vercel.json` | Delete the `X-Robots-Tag` line from the `"/(.*)"` block — **keep every other header, and keep the `/downloads/` block** | Server-level noindex on the live host |
| 4 | `public/_headers` | Delete the file | Cloudflare-only; inert on Vercel but a landmine if the host ever changes |

### Why both 3 and 4?

`_headers` is a **Cloudflare Pages** file. The site deploys to **Vercel**, which
ignores it completely — so the server-level noindex it was written to provide
was never actually running. Row 3 is the Vercel equivalent that does work. Row 4
removes the dead file so a future move back to Cloudflare doesn't silently
re-block the site.

### A note on how these interact

`robots.txt` `Disallow: /` prevents crawling, which means Google never fetches
the page and therefore never reads the `noindex` meta tag or the `X-Robots-Tag`
header. A disallowed URL can still appear in results as a bare link if something
external points at it. That is why row 1 is not sufficient alone pre-launch, and
why rows 2-4 exist as the layer that works once crawling is allowed.

---

## 2. Verify before announcing

After deploying the four changes:

```bash
npm run build

# Expect 0 — no page should carry a noindex meta
find dist -name '*.html' -exec grep -l 'content="noindex' {} + | wc -l

# Expect "Allow: /" and the Sitemap: line
cat dist/robots.txt

# Expect a real GTM- container id (analytics came on with allowIndexing)
grep -o 'GTM-[A-Z0-9]*' dist/index.html | head -1
```

Then on the live domain:

```bash
# Expect NO X-Robots-Tag in the response
curl -sI https://daitinstitute.com/ | grep -i x-robots-tag
```

Finally, in Google Search Console: add the property, submit
`https://daitinstitute.com/sitemap-index.xml`, and request indexing on the
homepage and the five program pages.

---

## 3. Known-good state (audited 2026-11-04)

Measured, not assumed — so re-check only if something changes.

**Core Web Vitals** (412x915 mobile, 4x CPU throttle, 1.6 Mbps, gzip on — Vercel
serves brotli, so production is better than these numbers):

| Page | FCP | LCP | CLS | Longest task |
|---|---|---|---|---|
| `/` | 1128ms | 1144ms | 0 | 90ms |
| `/programs/` | 608ms | 776ms | 0 | 0ms |
| `/programs/ai-ml-and-computer-vision/` | 548ms | 1236ms | 0 | 83ms |
| `/programs/ai-led-software-development/` | 604ms | 1732ms | 0 | 99ms |
| `/blog/which-it-course-after-graduation/` | 752ms | 1612ms | 0 | 69ms |
| `/contact/` | 568ms | 740ms | 0 | 0ms |

Budgets: LCP <= 2.5s, FCP <= 1.8s, CLS <= 0.1, longest task <= 200ms. All pass.

**Measure with compression on.** An uncompressed local server reports LCP of
4-5s on program pages, which is a harness artifact, not a site problem — the
program pages are ~180 KB of HTML that gzip to a fraction of that.

Also verified clean: exactly one `<h1>` on all 24 pages; self-referencing
canonicals on all 24; no duplicate titles, descriptions or canonicals; complete
OG and Twitter tags; `lang` and viewport everywhere; `Course`, `CourseInstance`,
`FAQPage`, `BreadcrumbList`, `EducationalOrganization` and `LocalBusiness`
JSON-LD; no broken internal links.

---

## 4. FIX BEFORE GO-LIVE — the canonical points at a redirect

Every canonical, every `og:url` and every sitemap URL says **non-www**:

```
<link rel="canonical" href="https://daitinstitute.com/programs/...">
```

but the live site **308-redirects non-www to www**:

```
https://daitinstitute.com/...   -> 308 -> https://www.daitinstitute.com/...
https://www.daitinstitute.com/... -> 200
```

So no page has a self-referencing canonical, and every sitemap entry points at
a URL that immediately redirects. Google will usually resolve this, but it
wastes crawl budget and Search Console will report the sitemap as "Page with
redirect". Settle it now, while nothing is indexed and the choice is free.

Pick ONE host and make all three agree — the site, the canonicals, and the
Google Business Profile / citations:

- **To keep www** (matches what the server already does): set
  `PUBLIC_SITE_URL=https://www.daitinstitute.com` in the Vercel project. The
  canonical, `og:url` and sitemap all derive from it, so that single variable
  fixes everything.
- **To keep non-www** (matches the code's default): change the primary domain
  in Vercel so www redirects to non-www instead of the other way round.

Then re-check:

```bash
curl -sI https://daitinstitute.com/ | grep -i location
curl -s https://<chosen host>/programs/digital-marketing-course-sambhaji-nagar/ \
  | grep -o '<link rel="canonical"[^>]*>'
```

The canonical must equal the URL that returns 200, with no redirect in between.

---

## 5. Still open (not indexing blockers)

- **Centre `geo` and `mapUrl` are unset** in `src/config/site.ts`. These are the
  strongest remaining hyperlocal signals. Take the lat/lng and the share link
  from the Google Business Profile pin — they must match it exactly, which is
  why they were left blank rather than approximated.
- **No Digital Marketing course photo.** `src/assets/hero/` has images for
  software development and data analytics but none for digital marketing. This
  is the one Rank Math check left unmet on that page (keyword in image alt):
  the only image without alt text there is the decorative hero backdrop, and
  putting keywords in a decorative image's alt is alt stuffing. A real photo
  closes it honestly.
- **Titles over 65 chars on 9 pages, descriptions over 165 on 9 pages.** These
  truncate in search results — no ranking cost, but they cost click-through.
  Worst: `will-ai-replace-software-developers-2026` (94-char title),
  `which-it-course-after-graduation` (285-char description).
- **`ANTHROPIC_API_KEY` is not set in Vercel.** The chat widget is gated on it
  at build time, so right now it simply does not render — nothing is broken on
  the live site. Set the variable when you want chat live.
- The content TODOs in `IMAGES-TODO.md` and `CLAUDE.md` (purpose-built 1200x630
  OG image, founder photo, real social URLs, placement/testimonial content).

---

## 6. Local-ranking work that is NOT in this repo

On-page and schema are a minority of local pack ranking. The rest is yours:

- **Google Business Profile** — primary category, the exact NAP below, photos,
  weekly posts, seeded Q&A. This is the single biggest lever.
- **Reviews** — volume, recency, and whether the text mentions the course and
  the city.
- **Citations** — JustDial, Sulekha, IndiaMART. The address must match
  byte-for-byte, including punctuation:

  > DAIT Institute, Ambedkar Chowk, Chikalthana, Sambhaji Nagar, Maharashtra 431007

  If the GBP says "Chhatrapati Sambhajinagar" and the site says "Sambhaji
  Nagar", decide which, then change `src/config/site.ts` and every citation to
  match it.
