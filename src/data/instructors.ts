/**
 * instructors.ts — the teaching roster shown on the homepage.
 *
 * Kept here rather than in a component so program pages can read the same list
 * later (filter by `area`) instead of the roster being duplicated.
 *
 * TODO — only DAIT can supply these, and the section degrades cleanly until then:
 *   1. Photos → public/images/team/<slug>.jpg, then set `photo`. Missing files
 *      fall back to an initials avatar (checked at build time), so a path can be
 *      wired before the file lands. Only the founder has one today.
 *   2. LinkedIn URLs — the card renders the icon only when `linkedinUrl` is set.
 *
 * Settled 2026-10-16: surnames are not needed (first names are deliberate for
 * everyone except the founder), and Prachi's title is confirmed as given.
 *
 * NOTE: no instructor is listed for Software Development yet — DAIT is supplying
 * one. Until then the homepage shows a teaching team covering three of four live
 * tracks, which an attentive visitor will notice. Add the entry here and it
 * appears automatically; no component change needed.
 */
import type { ProgramArea } from "./navigation";

/** What someone does for DAIT — a person can hold several. */
export type TeachingRole = "Instructor" | "Masterclass" | "Industry Mentor";

export interface Instructor {
  name: string;
  /** Job title / specialism, as it should read publicly. */
  role: string;
  /** Which program area they teach on — drives the badge and icon. */
  area: ProgramArea;
  /** Instructor / Masterclass / Industry Mentor — shown as chips. */
  teaches: TeachingRole[];
  /** Public path, e.g. /images/team/nilesh.jpg. Falls back to initials. */
  photo?: string;
  linkedinUrl?: string;
  /** Founder gets a subtle marker, same idea as the leadership grid. */
  founder?: boolean;
}

export const instructors: Instructor[] = [
  {
    name: "Amol G. Dhakne",
    role: "Founder & CMO, DAIT Institute",
    area: "digital-marketing",
    teaches: ["Instructor", "Masterclass", "Industry Mentor"],
    photo: "/images/founder.jpg",
    linkedinUrl: "https://www.linkedin.com/company/dait-institute/",
    founder: true,
  },
  {
    name: "Nilesh",
    role: "Performance Marketing Manager",
    area: "digital-marketing",
    teaches: ["Instructor", "Masterclass"],
    photo: "",
  },
  {
    name: "Prashant",
    role: "SEO Specialist",
    area: "digital-marketing",
    teaches: ["Instructor", "Masterclass"],
    photo: "",
  },
  {
    name: "Nikhil",
    role: "Senior .NET Tech Lead",
    area: "cloud-devops-security",
    teaches: ["Instructor"],
    photo: "",
  },
  {
    name: "Prachi",
    role: "AI Trainer",
    area: "data-ai",
    teaches: ["Masterclass", "Industry Mentor"],
    photo: "",
  },
  {
    name: "Manoj",
    role: "AI/ML Course Instructor",
    area: "data-ai",
    teaches: ["Instructor", "Masterclass"],
    photo: "",
  },
];
