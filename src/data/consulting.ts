/**
 * consulting.ts — all content for /business-consulting/.
 *
 * Copy and figures live here, not in the page, so the founder can edit claims
 * without touching markup. Every figure below is traceable to the CV; nothing
 * is inferred or rounded up.
 *
 * POSITIONING GUARDRAIL — read before editing any copy in this file.
 * DAIT Business Consulting advises, trains and coaches. It does NOT execute.
 * Never describe this vertical as an agency, a lead-generation service, a
 * campaign-execution company, a software developer or an implementation
 * partner, and never promise leads, demos, revenue or closures. The client's
 * own team, or a vendor they choose, does the execution.
 */

/* ------------------------------------------------------------------ stats */

export interface ConsultingStat {
  value: string;
  label: string;
  /** Small print under the figure — used to keep claims precise. */
  note?: string;
}

/**
 * CV-supported only. Note the first one says PIPELINE, not revenue — do not
 * reword it to imply closed revenue, and do not add percentages, client counts
 * or ROI figures that the CV does not support.
 */
export const consultingStats: ConsultingStat[] = [
  {
    value: "₹20 Cr+",
    label: "B2B pipeline across ABM-led engagements",
  },
  {
    value: "10+",
    label: "Enterprise logos won across verticals",
  },
  {
    value: "AI-first",
    label: "Building marketing, pre-sales and inbound teams with hands-on AI tooling",
  },
  {
    value: "4 regions",
    label: "USA, Asia, Middle East and DACH",
  },
];

/**
 * Shown under consultingStats, which are GROWTH figures. It used to say "over
 * a 9+ year career" and "not attributable to a single individual", which read
 * as one person's CV and contradicted a practice that works as a team.
 */
export const statsDisclaimer =
  "Figures reflect outcomes across professional engagements and team efforts, not results attributable to any single individual or guaranteed for any client.";

/**
 * Credentials for the TECHNOLOGY practice.
 *
 * consultingStats are marketing numbers — ABM pipeline, enterprise logos won.
 * Apt on a demand-generation page, irrelevant on an SAP or cloud page, where
 * they made the section read as a marketing CV attached to the wrong service.
 *
 * These are capability and model claims instead, which is what a technology
 * buyer is assessing: how much experience stands behind the advice, whether
 * it has met enterprise scale, and whether the adviser profits from the
 * recommendation.
 *
 * "15+ years" is COMBINED team experience, stated by the owner. It is not the
 * founder's own figure, which data above keeps at 9+ per his CV — do not
 * merge the two.
 */
export const practiceCredentials = [
  {
    icon: "lucide:users",
    value: "15+ years",
    label: "Combined industry experience across the team",
  },
  {
    icon: "lucide:building-2",
    value: "Enterprise",
    label: "Engagements with enterprise customers and use cases",
  },
  {
    icon: "lucide:scale",
    value: "Advisory only",
    label: "No implementation revenue, no vendor commission",
  },
  {
    icon: "lucide:network",
    value: "Partner network",
    label: "Delivery through specialists you select, not us",
  },
] as const;

/* --------------------------------------------------------------- services
 *
 * The services themselves moved to the `consulting` content collection
 * (src/content/consulting/*.mdx), because each one now has its own landing
 * page and the hub is a directory that routes to them. Defining a service
 * in both places would render it twice on the hub.
 *
 * Only the practice headings stay here, since they are page furniture
 * rather than service data.
 */


/** Headings for each practice, used where the services are grouped. */
export const serviceCategories = [
  {
    key: "growth" as const,
    label: "Growth & go-to-market",
    blurb:
      "Founder-led work on who you sell to, what you say, and how marketing and sales operate as one motion.",
  },
  {
    key: "technology" as const,
    label: "Technology & transformation",
    blurb:
      "Advisory for midsize and enterprise teams deciding what to build, buy or modernise — the assessment, the business case and the partner selection. Implementation stays with your team or the partner you choose.",
  },
];


/* ------------------------------------------------------------- industries */

export interface ConsultingIndustry {
  name: string;
  /** The business problem DAIT can help with — not a claim of technical expertise. */
  challenge: string;
  icon: string;
}

/**
 * Manufacturing and industrial lead, because that is the intended local market.
 * Each entry states a GROWTH challenge. None of these claim engineering or
 * subject-matter expertise in the industry itself.
 */
export const consultingIndustries: ConsultingIndustry[] = [
  {
    name: "Cement & building materials",
    challenge:
      "Long sales cycles and dealer-led demand, with little visibility of which accounts are worth pursuing.",
    icon: "lucide:building-2",
  },
  {
    name: "Wires, cables & electrical products",
    challenge:
      "Competing largely on price because the technical value is never made clear to the buying committee.",
    icon: "lucide:cable",
  },
  {
    name: "Industrial manufacturing & engineering",
    challenge:
      "Strong products, weak pipeline — outreach that never reaches the people who sign.",
    icon: "lucide:factory",
  },
  {
    name: "IT services & enterprise software",
    challenge:
      "Crowded market, undifferentiated positioning, and marketing that generates volume rather than qualified conversations.",
    icon: "lucide:server",
  },
  {
    name: "SaaS & cloud solutions",
    challenge:
      "Sales and marketing pulling in different directions, with no shared definition of a qualified opportunity.",
    icon: "lucide:cloud",
  },
  {
    name: "AI, data analytics & digital transformation",
    challenge:
      "Genuinely strong capability that buyers struggle to evaluate, compare or justify internally.",
    icon: "lucide:brain-circuit",
  },
  {
    name: "Healthcare technology & fertility services",
    challenge:
      "Sensitive, trust-led buying decisions that generic marketing handles badly.",
    icon: "lucide:heart-pulse",
  },
  {
    name: "B2C & consumer services",
    challenge:
      "Spend that cannot be tied back to enquiries, bookings or revenue.",
    icon: "lucide:store",
  },
];

/* ---------------------------------------------------------------- process */

export interface ProcessStage {
  title: string;
  body: string;
}

export const consultingProcess: ProcessStage[] = [
  {
    title: "Understand",
    body: "Assess your business objectives, target markets and the capability that already exists in your team.",
  },
  {
    title: "Diagnose",
    body: "Identify the real gaps in strategy, demand generation, sales process and conversion — not the assumed ones.",
  },
  {
    title: "Strategise",
    body: "Build a practical roadmap with prioritised recommendations your team can act on.",
  },
  {
    title: "Coach",
    body: "Train your people and guide the execution decisions as they make them.",
  },
  {
    title: "Review",
    body: "Evaluate the agreed indicators together and adjust what is not working.",
  },
];

export const processBoundary =
  "At every stage your team, or an execution partner you select, does the implementation. DAIT advises, trains and reviews — we do not take over your marketing or sales function.";

/* -------------------------------------------------------- partner network */

export interface PartnerCategory {
  name: string;
  description: string;
  icon: string;
}

export const partnerCategories: PartnerCategory[] = [
  {
    name: "ERP & CRM",
    description: "Implementation specialists for business and customer systems.",
    icon: "lucide:database",
  },
  {
    name: "AI & automation",
    description: "Teams that build and deploy applied AI and workflow automation.",
    icon: "lucide:bot",
  },
  {
    name: "Industrial software",
    description: "Providers serving manufacturing and plant environments.",
    icon: "lucide:cog",
  },
  {
    name: "Cloud & data analytics",
    description: "Infrastructure, warehousing and business-intelligence partners.",
    icon: "lucide:cloud",
  },
  {
    name: "IT & software services",
    description: "Product engineering and custom development teams.",
    icon: "lucide:code-xml",
  },
  {
    name: "SEO & performance marketing",
    description: "Execution partners for search and paid channels.",
    icon: "lucide:trending-up",
  },
];

/* ----------------------------------------------------- company references */

export interface CompanyReference {
  name: string;
  /** How DAIT was actually involved. Be exact — this is the whole point. */
  relationship: "Direct client" | "Account engagement" | "Prospecting & outreach";
  /** Written permission to publish the name. Nothing renders without it. */
  approved: boolean;
  logo?: string;
}

/**
 * DELIBERATELY EMPTY. The founder mentioned organisations including Malpani,
 * Dalmia Bharat, Polycab, Digvijay Cement, Chettinad Cement, RR Kabel, Advait
 * Green Energy, Universal Cables, KEI Wires & Cables, Nova and Birla Fertility.
 *
 * They are NOT listed here because publishing a company name implies a client
 * relationship and an endorsement. Before any entry is added:
 *   1. confirm it was a direct client, not prospecting or team-wide involvement,
 *   2. obtain written permission to use the name publicly,
 *   3. never upload a logo taken from their website.
 *
 * CompanyReferences.astro renders nothing while this is empty, and only ever
 * renders entries with `approved: true`.
 */
export const companyReferences: CompanyReference[] = [];

/* -------------------------------------------------------------- founder */

export const founderConsulting = {
  name: "Amol G. Dhakne",
  positioning:
    "B2B Growth Strategist | Marketing & Pre-Sales Leader | Fractional CMO | Corporate Trainer",
  /** 9+ per the CV. Do not inflate to 10+ without an updated, verified CV. */
  experience: "9+ years",
  bio: [
    "Amol G. Dhakne is a B2B marketing and growth professional with experience across IT services, SaaS, cloud, AI, data analytics, digital transformation and B2C services. His work has centred on building marketing functions from scratch, developing go-to-market strategies, designing account-based marketing programmes, strengthening sales enablement and leading cross-functional marketing teams.",
    "He has worked across the USA, Asia, the Middle East and DACH markets, supporting business growth through targeted outreach, executive engagement, partner marketing, content-led demand generation and enterprise sales enablement.",
    "He uses AI tools — Claude, ChatGPT, Gemini and Copilot — in day-to-day marketing work, from research and competitor analysis to content and campaign preparation, and runs internal AI training workshops for teams adopting them.",
    "His approach combines strategic thinking with practical team coaching, helping businesses improve their own capability rather than depend entirely on external agencies.",
  ],
  /**
   * Credential cards, same treatment as the homepage founder block.
   * IIM Raipur was an executive PROGRAMME, not a degree — keep that wording.
   * Years stay at 9+ per the CV; do not inflate without a verified update.
   */
  credentials: [
    {
      icon: "lucide:award",
      value: "IIM Raipur",
      label: "Strategic CMO Programme",
    },
    {
      icon: "lucide:briefcase-business",
      value: "9+ years",
      label: "B2B marketing & pre-sales leadership",
    },
    {
      icon: "lucide:globe",
      value: "4 regions",
      label: "USA · Asia · Middle East · DACH",
    },
    {
      icon: "lucide:sparkles",
      value: "AI-first",
      label: "Claude, ChatGPT and Gemini in daily practice",
    },
  ],
  photo: "/images/founder.jpg",
};
