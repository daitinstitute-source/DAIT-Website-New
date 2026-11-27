/**
 * content.config.ts — Astro content collections (loader API).
 * Programs are MDX + Zod. Blog/placements/faculty collections come later
 * (directories reserved so structure scales from day 1).
 */
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const programs = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/programs" }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    /**
     * Search metadata, separate from the visible copy.
     *
     * `title` and `tagline` are written for the person reading the page; a meta
     * title and description are written for a search result. Making one string
     * do both jobs means the page reads like an advert or the SERP entry
     * carries no keywords. These three let a program be tuned for search
     * WITHOUT a word of on-page copy changing.
     *
     * All optional — a program that sets none keeps the generated defaults in
     * src/pages/programs/[slug].astro, so existing programs are untouched.
     *
     * seoTitle:       aim for <=65 characters, or Google truncates it.
     * seoDescription: aim for <=165, same reason. Lead with the keyword.
     * keywords:       the <meta name="keywords"> tag. Google has ignored this
     *                 since 2009 — it is kept because it costs nothing and a
     *                 couple of smaller engines still read it. Do NOT treat it
     *                 as the place where keyword work happens.
     */
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    area: z.enum([
      "software-development",
      "data-ai",
      "cloud-devops-security",
      "digital-marketing",
    ]),
    // Optional: some programs are deliberately published without a stated
    // length. Every render site guards on it — see ProgramCard, BatchEnrollment,
    // SyllabusTracks, ProgramAudienceToggle and Brochure.
    duration: z.string().optional(), // "6 months"
    mode: z.array(z.enum(["classroom", "online", "hybrid"])),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    audience: z.array(z.enum(["graduates", "working-professionals"])),
    batchOptions: z.array(z.string()), // ["Weekday (Mon–Fri)", "Weekend (Sat–Sun)"]
    fee: z.string().optional(), // display string; omit -> "Contact for fees"
    nextBatchDate: z.coerce.date().optional(),
    highlights: z.array(z.string()), // 4–6 bullets for cards
    tools: z.array(z.string()), // tech/tool names — Simple Icons on detail page
    syllabus: z.array(
      z.object({ module: z.string(), topics: z.array(z.string()) }),
    ),
    // Optional ADVANCED track for working professionals (upskill/career-switch).
    // When present, the program page's audience toggle swaps the curriculum to this.
    // The top-level `syllabus` is the Foundation track (freshers/beginners).
    professionalTrack: z
      .object({
        tagline: z.string().optional(),
        duration: z.string().optional(), // advanced track often differs from foundation
        fee: z.string().optional(), // advanced track priced separately
        syllabus: z.array(
          z.object({ module: z.string(), topics: z.array(z.string()) }),
        ),
        workSkills: z.array(z.string()).default([]), // day-to-day, apply-at-work skills
        tools: z.array(z.string()).default([]), // advanced tools on top of the base set
      })
      .optional(),
    // Admissions info (upGrad-style "who can join"). Optional — omit to hide the section.
    eligibility: z.array(z.string()).default([]), // ["Any graduate / final-year student", ...]
    prerequisites: z.array(z.string()).default([]), // ["No coding background required", ...]
    batchSize: z.string().optional(), // "Max 20 learners per batch"
    outcomes: z.array(z.string()), // concrete job roles / skills
    certification: z.string().optional(),
    faqs: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
    faculty: z.array(z.object({
      name: z.string(),
      role: z.string(),
      experience: z.string(),
      expertise: z.array(z.string()),
      linkedinUrl: z.string().optional(),
    })).default([]),
    testimonials: z.array(z.object({
      name: z.string(),
      jobTitle: z.string(),
      company: z.string(),
      quote: z.string(),
      rating: z.number().min(1).max(5).default(5),
      salaryHike: z.string().optional(), // e.g., "40% salary hike"
    })).default([]),
    whyDAIT: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string(), // lucide icon name
    })).default([]),
    /**
     * The roles this program leads to, as a slider of real job descriptions.
     *
     * This replaced a list of salary bands. A band like "₹4–7 LPA" told a
     * prospective student almost nothing useful, needed a disclaimer under it
     * every time, and dated badly — while what people actually want to know is
     * what the job IS and whether they would like doing it.
     *
     * Describe the role as it exists in the market. Do not imply DAIT places
     * anyone into it: that claim lives nowhere on this site.
     */
    jobRoles: z.array(z.object({
      title: z.string(),
      /** One or two sentences: what this person actually does. */
      summary: z.string(),
      /** 3-4 concrete day-to-day tasks. */
      responsibilities: z.array(z.string()).default([]),
      /** Tools used in the job, which should overlap what the course teaches. */
      tools: z.array(z.string()).default([]),
      /** Who hires for it locally, e.g. "IT services firms, agencies, in-house teams". */
      hires: z.string().optional(),
      /** Where it sits on a career path, e.g. "Common first role". */
      level: z.string().optional(),
      icon: z.string().optional(), // lucide name; falls back to a briefcase
    })).default([]),
    careerOutcomes: z.array(z.object({
      category: z.string(), // "Skills Mastered", "Where This Leads"
      items: z.array(z.string()),
      note: z.string().optional(), // optional source/disclaimer line
    })).default([]),
    featured: z.boolean().default(false), // shown on homepage
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("DAIT Institute"),
    category: z.string().default("Career Guide"),
    tags: z.array(z.string()).default([]),
    readMinutes: z.number().default(5),
    // Optional cover photo (public path, e.g. /images/blog/<slug>.jpg). Falls back
    // to a branded gradient banner when absent — drop a real photo in to humanise.
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // Optional Q&A block. Rendered at the end of the post AND emitted as
    // FAQPage JSON-LD, which is what earns the expandable FAQ rich result
    // in Google. Keep answers self-contained — Google strips markup.
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * Consulting services that have their own landing page.
 *
 * These compete on national, high-intent B2B terms ("SAP consulting India",
 * "application modernisation consulting"), so unlike the course pages their
 * slugs carry NO city — the buyer is rarely in Sambhaji Nagar and the site's
 * ProfessionalService schema already declares areaServed: India.
 *
 * A service lives EITHER here or in the `consultingServices` array in
 * src/data/consulting.ts, never both, or the hub renders it twice. Growth
 * services are still in the array; the technology practice lives here.
 */
const consulting = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/consulting" }),
  schema: z.object({
    title: z.string(),
    /** Hub card summary and the page's opening line. */
    tagline: z.string(),
    icon: z.string(),
    /**
     * Which practice this belongs to. Growth work the founder delivers
     * personally; technology work is advisory with a partner implementing.
     * The hub groups by this, and the nav menu splits on it.
     */
    category: z.enum(["growth", "technology"]).default("technology"),
    /** Rendered with stronger visual prominence on the hub. */
    flagship: z.boolean().default(false),
    /**
     * Where DAIT stops. REQUIRED, not optional: every one of these services is
     * something an enterprise buyer will assume is delivered in-house unless
     * the page says otherwise, and the whole page's credibility rests on it.
     */
    boundary: z.string(),
    /** Bullets for the hub card. */
    points: z.array(z.string()),
    /**
     * The primary CTA wording. A CTA that names the outcome converts better
     * than "Book a consultation", and the natural first step genuinely differs
     * per service — a readiness assessment is not a workshop. Falls back to a
     * generic ask so a new service is never missing a button.
     */
    ctaLabel: z.string().optional(),
    /**
     * Platforms and tools this service advises ON — not tools DAIT implements
     * with. The distinction is the whole practice, so the rendered label says
     * "advise on" and must keep saying it.
     *
     * Kept short on purpose. The best example of this section in the wild
     * (Innowise's Tableau page) lists four product names beside a named
     * executive quote; authority comes from placement, not from a catalogue.
     * Only list what a buyer would actually be choosing between.
     */
    technologies: z.array(z.string()).default([]),

    // ---- search metadata, kept apart from the visible copy (as programs do)
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    keywords: z.array(z.string()).default([]),

    // ---- detail page
    /** The situation a buyer is in when they look for this. */
    heroIntro: z.string(),
    /** Problems DAIT gets called in for — the page's qualifying section. */
    problems: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    /** How an engagement actually runs, in order. */
    engagement: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    /** What the client is left holding at the end. */
    deliverables: z.array(z.string()).default([]),
    /** Who this suits — and, where useful, who it does not. */
    forWho: z.array(z.string()).default([]),
    /** Rendered on the page AND emitted as FAQPage JSON-LD. */
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

export const collections = { programs, blog, consulting };
