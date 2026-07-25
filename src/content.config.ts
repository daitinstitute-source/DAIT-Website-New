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
    area: z.enum([
      "software-development",
      "data-ai",
      "cloud-devops-security",
      "digital-marketing",
    ]),
    duration: z.string(), // "6 months"
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
    careerOutcomes: z.array(z.object({
      category: z.string(), // "Job Roles", "Skills", "Salary Range"
      items: z.array(z.string()),
      note: z.string().optional(), // e.g. source disclaimer: "Market averages — AmbitionBox, 2025"
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
    draft: z.boolean().default(false),
  }),
});

export const collections = { programs, blog };
