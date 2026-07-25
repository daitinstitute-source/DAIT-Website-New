/**
 * navigation.ts — the site's navigation structure. Change nav HERE, not in the
 * Header/Footer components. Program areas drive the Programs dropdown; the
 * dropdown lists live programs from the content collection at render time.
 */
import { siteConfig } from "../config/site";

export type ProgramArea =
  | "software-development"
  | "data-ai"
  | "cloud-devops-security"
  | "digital-marketing";

export interface AreaMeta {
  slug: ProgramArea;
  label: string; // display name
  short: string; // filter-tab label
  description: string; // 2-line card copy
  icon: string; // lucide icon for astro-icon
}

/** The 4 program areas (enum mirrors content.config.ts). Order = display order. */
export const programAreas: AreaMeta[] = [
  {
    slug: "software-development",
    label: "Software Development",
    short: "Software Development",
    description:
      "Full-stack, web, and mobile engineering — from your first line of code to a hireable developer portfolio.",
    icon: "lucide:code-xml",
  },
  {
    slug: "data-ai",
    label: "Data Science & AI",
    short: "Data & AI",
    description:
      "Data analytics, machine learning, and applied AI — the skills employers are hiring for right now.",
    icon: "lucide:brain-circuit",
  },
  {
    slug: "cloud-devops-security",
    label: "Cloud, DevOps & Security",
    short: "Cloud, DevOps & Security",
    description:
      "AWS/Azure, DevOps pipelines, networking, and cybersecurity — the backbone of modern IT teams.",
    icon: "lucide:shield-check",
  },
  {
    slug: "digital-marketing",
    label: "Digital Marketing",
    short: "Digital Marketing",
    description:
      "AI-powered digital marketing and non-coding IT tracks — career paths that don't require programming.",
    icon: "lucide:megaphone",
  },
];

export interface NavItem {
  label: string;
  href: string;
  /** If set, this is a dropdown whose items are the program areas. */
  dropdown?: boolean;
  /** Hidden until the target page exists (Phase 3+). */
  comingSoon?: boolean;
  /** External (e.g. portal subdomain). */
  external?: boolean;
}

/** Primary header nav. The CTA button is rendered separately, always visible. */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs/", dropdown: true },
  { label: "For Colleges", href: "/for-colleges/" },
  // Parked until the B2B offering is settled — see siteConfig.display.showForCompanies.
  { label: "For Companies", href: "/for-companies/", comingSoon: !siteConfig.display.showForCompanies },
  { label: "Blog", href: "/blog/" },
  { label: "Why DAIT", href: "/why-dait/" }, // Dhakne Education Group legacy story
  { label: "Contact", href: "/contact/" },
];

/** Reserved slot — points to the separate portal app (Phase 4). */
export const studentLogin: NavItem = {
  label: "Student Login",
  href: "https://portal.daitinstitute.com",
  external: true,
  comingSoon: true, // hidden until the portal exists
};

/** Primary site-wide CTA. */
export const primaryCta = {
  label: "Book Free Career Counselling",
  href: "/contact/",
} as const;

/** Footer quick links. */
export const footerQuickLinks: NavItem[] = [
  { label: "All Programs", href: "/programs/" },
  { label: "Contact", href: "/contact/" },
  { label: "Book Counselling", href: "/contact/" },
];
