# Images to add (free Unsplash / Pexels) — drop-in, no code changes

The site is wired so every image slot below **auto-activates the moment you save the file** at the exact path. Until then it shows a branded gradient/silhouette fallback (nothing looks broken). All images must be **self-hosted** (saved into `public/`), not hotlinked.

**How to use:** open the Unsplash/Pexels search, pick a photo, **Download (free)**, rename to the exact filename, save at the path shown, then `npm run build`.

**Licensing:** Unsplash & Pexels are free for commercial use, no attribution required. Prefer real, diverse Indian students/professionals where possible.

---

## 1. Hero backgrounds (highest impact — one file updates many pages)

Landscape, **1600×900+** (16:9). A blue overlay is applied automatically, so mid-tone photos read fine and text stays legible.

| Save as | Used on | Show | Search |
|---|---|---|---|
| `public/images/hero/learners.jpg` | Home, all program pages, Blog | Diverse students / young professionals learning on laptops in a bright classroom | [Unsplash: students classroom](https://unsplash.com/s/photos/students-classroom) · [Pexels](https://www.pexels.com/search/students%20classroom/) |
| `public/images/hero/colleges.jpg` | For Colleges | College students on campus / in a lecture hall | [Unsplash: college students](https://unsplash.com/s/photos/college-students) · [Pexels](https://www.pexels.com/search/college%20students/) |
| `public/images/hero/companies.jpg` | For Companies | A modern office / diverse team collaborating | [Unsplash: office team](https://unsplash.com/s/photos/office-team) · [Pexels](https://www.pexels.com/search/office%20team/) |

*(Only `learners.jpg` is required — the other two fall back to it automatically.)*

---

## 2. Blog cover photos

Landscape, **1200×675** (16:9). Frontmatter is already set — just add the files.

| Save as | Post | Show | Search |
|---|---|---|---|
| `public/images/blog/digital-marketing-career.jpg` | Digital Marketing Career | Marketer reviewing analytics on a laptop | [Unsplash: digital marketing](https://unsplash.com/s/photos/digital-marketing) |
| `public/images/blog/ai-skills-freshers.jpg` | AI Skills for Freshers | Young person using AI / laptop | [Unsplash: laptop working](https://unsplash.com/s/photos/student-laptop) |
| `public/images/blog/fresher-vs-professional.jpg` | Fresher vs Professional | Students & professionals collaborating | [Unsplash: teamwork learning](https://unsplash.com/s/photos/teamwork) |

**Inline images in a post:** drop a file in `public/images/blog/` and reference it in the `.mdx` body: `![Caption text](/images/blog/your-photo.jpg)`

---

## 3. Content-section photos

Roughly **4:3** (e.g. 1000×750). Show a gradient panel until added.

| Save as | Used on | Show | Search |
|---|---|---|---|
| `public/images/content/campus.jpg` | Why DAIT ("Where you'll learn") | Students learning / your classroom or centre | [Unsplash: classroom learning](https://unsplash.com/s/photos/classroom) · [Pexels](https://www.pexels.com/search/classroom/) |
| `public/images/content/classroom.jpg` | Every program page ("How you'll learn") | Hands-on: people at laptops / coding / working together | [Unsplash: students laptop](https://unsplash.com/s/photos/coding-class) · [Pexels](https://www.pexels.com/search/coding%20class/) |

---

## 4. People & brand (optional but recommended)

| Save as | What | Size | Notes |
|---|---|---|---|
| `public/images/founder.jpg` | Founder (Amol G. Dhakne) | ~800×1000 portrait | ✅ already added |
| `public/images/group/team/*.jpg` | Leadership photos (G.R., M.R., Prof. D.R., Rushikesh Dhakne) | ~600×600 square | Falls back to initials avatars; wire each path into `siteConfig.group.leadership[].photo` |
| `public/images/group/bachpan-international.png` | Bachpan International School logo | transparent PNG | The only missing sister-institution logo |
| `public/images/logo/dait-og-1200x630.png` | Social-share (OG) image | 1200×630 | Then set `siteConfig.logo.ogImage` to it |

---

*Tip: keep hero JPEGs under ~300 KB (export at 70–80% quality) so pages stay fast.*
