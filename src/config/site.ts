/**
 * siteConfig — single source of truth for domain, contact info, centers, and
 * social links. Change these here, never inline in components.
 *
 * Fields marked `TODO:` are placeholders awaiting real facts (per BRAND rules,
 * we surface a TODO rather than invent). Search "TODO:" before launch.
 */

export interface Center {
  name: string;
  addressLines: string[];
  city: string;
  state: string;
  postalCode?: string;
  phone: string;
  mapUrl?: string; // Google Maps link/embed
  hours: string; // human display, e.g. "Mon–Sat · 9:00 AM – 6:00 PM"
  openingHours?: string; // schema.org format, e.g. "Mo-Sa 09:00-18:00"
  geo?: { lat: number; lng: number }; // exact centre coords → hyperlocal LocalBusiness schema
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string; // simple-icons name for astro-icon (e.g. "simple-icons:instagram")
}

const PUBLIC_SITE_URL =
  import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://daitinstitute.com";

// Digits-only for wa.me links (no +, spaces, or dashes). India country code 91.
const WHATSAPP_NUMBER =
  import.meta.env.PUBLIC_WHATSAPP_NUMBER?.replace(/[^\d]/g, "") ||
  "918668893439";

export const siteConfig = {
  name: "DAIT Institute",
  legalName: "Dhakne's Digital AI & IT Training Institute",
  shortName: "DAIT",
  url: PUBLIC_SITE_URL,

  // ⛔ LAUNCH GATE — while false, EVERY page is noindex/nofollow and all crawlers
  // (Google, Bing AND AI bots: GPTBot, PerplexityBot, ClaudeBot, Google-Extended…)
  // are blocked. Flip to true ONLY on the owner's green signal, then also switch
  // public/robots.txt and public/_headers to their "live" versions.
  allowIndexing: false,

  tagline: "Industry-Aligned Training for AI & Tech Careers",
  description:
    "DAIT Institute — industry-aligned IT & AI training in Sambhaji Nagar. Practical, project-first programs in Software Development, Data Science & AI, Cloud/DevOps/Security, and Digital Marketing — led by an IIM-Raipur-trained founder, with real projects and placement support.",

  email: "info@daitinstitute.com",
  // Primary phone for click-to-call / schema (also the WhatsApp number).
  phone: "+91 86688 93439",

  whatsapp: {
    number: WHATSAPP_NUMBER, // digits only, for wa.me
    defaultMessage:
      "Hi DAIT Institute, I'd like to know more about your programs.",
  },

  // Logo assets (in public/images/logo/). SVG = use everywhere.
  logo: {
    horizontalLight: "/images/logo/dait-logo-horizontal-light.svg", // for light bg
    horizontalDark: "/images/logo/dait-logo-horizontal-dark.svg", // for dark bg
    stackedLight: "/images/logo/dait-logo-stacked-light.svg",
    stackedDark: "/images/logo/dait-logo-stacked-dark.svg",
    icon: "/images/logo/dait-icon-master.png",
    ogImage: "/images/logo/dait-logo-stacked-light-960w.png", // TODO: replace with a purpose-built 1200x630 OG image
  },

  // Multi-center ready from day 1 (even with one entry).
  centers: [
    {
      name: "DAIT Institute — Sambhaji Nagar",
      addressLines: ["Chikalthana"],
      city: "Sambhaji Nagar",
      state: "Maharashtra",
      postalCode: "431007",
      phone: "+91 86688 93439",
      mapUrl: "", // TODO: paste the Google Maps share link for the centre
      hours: "Mon–Sat · 9:00 AM – 6:00 PM",
      openingHours: "Mo-Sa 09:00-18:00",
      // TODO: exact centre coordinates (from the Google Maps pin) → strengthens
      // hyperlocal ranking. Replace with e.g. { lat: 19.8620, lng: 75.3910 }
      geo: undefined as { lat: number; lng: number } | undefined,
    },
  ] satisfies Center[],

  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/dait-institute/", icon: "simple-icons:linkedin" },
    // Add Instagram / YouTube / Facebook here once those profiles exist.
  ] satisfies SocialLink[],

  // Founder story — real credentials (no invented stats).
  founder: {
    name: "Amol G. Dhakne",
    role: "Founder & CMO, DAIT Institute",
    photo: "/images/founder.jpg",
    // The IIM credential — the marquee trust signal, surfaced site-wide via <IimBadge/>.
    iim: {
      school: "IIM Raipur",
      program: "Strategic CMO Programme",
      tag: "IIM Raipur Alumnus", // short label for badges
    },
    // Pull-quote for the founder section.
    quote:
      "The true value of AI is not replacing people — it's helping skilled people do better work, faster and smarter.",
    // Bio: industry-first, then the family legacy. <strong> is rendered via set:html
    // (trusted, in-repo content only).
    bio: [
      "DAIT Institute was founded by <strong>Amol G. Dhakne</strong>, a B2B marketing &amp; pre-sales leader with <strong>10+ years of industry experience</strong> building teams and go-to-market functions from scratch across the <strong>USA, Asia, Middle East and DACH</strong> (Switzerland, Germany, Austria) regions. He uses AI tools like <strong>Claude, ChatGPT and Gemini</strong> every single day — the exact practical workflows he now teaches at DAIT.",
      "He brings that experience home to a family that has educated Sambhaji Nagar since <strong>1998</strong>. An engineer with an <strong>MBA from Dr. Babasaheb Ambedkar Marathwada University (BAMU)</strong> and a <strong>Strategic CMO Programme from IIM Raipur</strong>, Amol is building DAIT as the family's newest institution — for IT, AI and digital careers.",
    ],
    // Credential cards (2×2). Grounded facts, no invented metrics.
    highlights: [
      {
        icon: "lucide:award",
        value: "IIM Raipur",
        label: "Chief Marketing Officer Programme",
      },
      {
        icon: "lucide:globe",
        value: "4 Global Regions",
        label: "USA · Asia · Middle East · DACH",
      },
      {
        icon: "lucide:briefcase-business",
        value: "10+ Years",
        label: "B2B marketing & pre-sales leader",
      },
      {
        icon: "lucide:sparkles",
        value: "AI-First",
        label: "Claude · ChatGPT · Gemini, daily",
      },
    ],
    // Domains the founder has worked across (industry-experience pills).
    domains: [
      "SaaS",
      "Cloud (Azure/GCP)",
      "AI & Data Analytics",
      "HubSpot",
      "Performance Marketing",
      "B2B GTM",
    ],
  },

  // The Dhakne Education Group — the family legacy that anchors DAIT's credibility.
  // Institution logos live in public/images/group/ ; leadership photos in
  // public/images/group/team/ . Missing files degrade to text / initials avatars.
  group: {
    name: "Dhakne Education Group",
    established: 1998,
    tagline: "Educating Sambhaji Nagar since 1998",
    // Institution logos live in public/images/group/. Set false to fall back to
    // clean text cards (e.g. if a logo file is missing).
    showLogos: true,
    blurb:
      "For over 25 years the Dhakne family has run trusted schools and coaching institutes across Sambhaji Nagar. DAIT Institute is the family's next step — bringing the same commitment into IT, AI and digital skills.",
    institutions: [
      { name: "SDA English School", type: "English-medium School", logo: "/images/group/sda-english-school.jpg" },
      { name: "New Dhakne's Academy", type: "Coaching Institute", logo: "/images/group/new-dhakne-academy.jpg" },
      { name: "New Maitree Classes", type: "Coaching Classes", logo: "/images/group/new-maitree-classes.jpg" },
      { name: "Bachpan International School", type: "Pre-school & School", logo: "" },
    ],
    // Management team. `photo` optional — falls back to an initials avatar.
    leadership: [
      {
        name: "Amol G. Dhakne",
        title: "Founder & CMO, DAIT Institute",
        also: "CMO, New Dhakne Academy",
        photo: "/images/founder.jpg",
        founder: true,
        late: false,
      },
      {
        name: "G. R. Dhakne",
        title: "Managing Director, New Dhakne Academy",
        also: "",
        photo: "",
        founder: false,
        late: false,
      },
      {
        name: "M. R. Dhakne",
        title: "Founder & MD — New Maitree Classes, SDA English School & Bachpan International",
        also: "",
        photo: "",
        founder: false,
        late: true,
      },
      {
        name: "Prof. D. R. Dhakne",
        title: "Founder & MD — New Maitree Classes, SDA English School & Bachpan International",
        also: "",
        photo: "",
        founder: false,
        late: false,
      },
      {
        name: "Rushikesh Dhakne",
        title: "Managing Director, New Dhakne Academy",
        also: "",
        photo: "",
        founder: false,
        late: false,
      },
    ],
  },

  // Pricing strategy — penetration first. Fees are deliberately below the local
  // market (Felix ~₹35k, PIIDM/QuickXpert ₹20–45k) to win early market share.
  // This framing keeps low prices reading as an intentional launch offer, not "cheap".
  pricing: {
    launchLabel: "Founding-batch launch price",
    launchNote: "Introductory pricing for our first batches — limited seats.",
  },

  // Reserved for Phase 4 portal (separate app).
  portalUrl: "https://portal.daitinstitute.com", // not built yet

  analytics: {
    // Google Tag Manager container (copied from the existing daitinstitute.com).
    // GA4 is configured INSIDE this container, so no separate GA4 tag is needed here.
    gtmId: import.meta.env.PUBLIC_GTM_ID || "GTM-M2CXJCSP",
    ga4Id: import.meta.env.PUBLIC_GA4_ID || "", // leave blank — GA4 comes via GTM (avoids double-counting)
    metaPixelId: import.meta.env.PUBLIC_META_PIXEL_ID || "", // blank disables Meta Pixel
  },
} as const;

/** Build a wa.me click-to-chat URL. Returns "" if no number configured. */
export function whatsappLink(message?: string): string {
  if (!siteConfig.whatsapp.number) return "";
  const text = encodeURIComponent(message ?? siteConfig.whatsapp.defaultMessage);
  return `https://wa.me/${siteConfig.whatsapp.number}?text=${text}`;
}

export type SiteConfig = typeof siteConfig;
