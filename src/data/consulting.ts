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

export const statsDisclaimer =
  "Figures reflect outcomes across professional engagements and team efforts over a 9+ year career, not results attributable to a single individual or guaranteed for any client.";

/* --------------------------------------------------------------- services */

export interface ConsultingService {
  title: string;
  summary: string;
  points: string[];
  icon: string;
  /** Flagship card — rendered with stronger visual prominence. */
  flagship?: boolean;
  /** Scope boundary shown on the card, where confusion is likely. */
  boundary?: string;
  /**
   * Which practice this belongs to. Thirteen cards in one grid is a wall;
   * split, it also makes the two propositions legible — growth work the
   * founder delivers personally, and technology work that is advisory with
   * delivery through partners.
   */
  category?: "growth" | "technology";
}

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

export const consultingServices: ConsultingService[] = [
  {
    title: "Manufacturing & Industrial B2B Growth",
    category: "growth",
    summary:
      "For cement, cables, electricals and engineering businesses that sell complex products to long buying committees.",
    icon: "lucide:factory",
    flagship: true,
    points: [
      "Industrial account targeting and territory focus",
      "Reaching the decision-makers who actually sign",
      "Marketing complex, technical products credibly",
      "Buyer-journey and buying-committee mapping",
      "Enterprise outreach and sales enablement",
      "Digital-transformation marketing for industrial firms",
    ],
  },
  {
    title: "B2B Growth Strategy & Advisory",
    category: "growth",
    summary:
      "The foundations: who you sell to, what you say, and how marketing and sales work as one motion.",
    icon: "lucide:compass",
    points: [
      "Go-to-market strategy",
      "Ideal customer profile and target-market definition",
      "Positioning and value proposition",
      "Marketing and sales alignment",
      "Growth roadmaps and fractional advisory",
    ],
  },
  {
    title: "Demand Generation & ABM",
    category: "growth",
    summary:
      "How qualified conversations get created — designed with your team, run by your team.",
    icon: "lucide:target",
    boundary:
      "We design the frameworks and train your team. Campaign execution stays with you or your chosen vendor.",
    points: [
      "Inbound marketing strategy",
      "SEO and website conversion advisory",
      "Outbound prospecting frameworks",
      "Account-based marketing",
      "LinkedIn, Google and Meta campaign strategy",
      "Paid-media planning, including specialised channels such as Spotify and OTT",
      "Lead qualification and funnel optimisation",
    ],
  },
  {
    title: "Sales Enablement & Pipeline Development",
    category: "growth",
    summary:
      "Turning interest into a managed pipeline your sales team can actually work.",
    icon: "lucide:git-branch",
    boundary:
      "This is process consulting and training. DAIT does not book appointments, run your outreach or close deals on your behalf.",
    points: [
      "Prospecting and target-account strategy",
      "Appointment and demo-setting frameworks",
      "Discovery-call and qualification processes",
      "Sales handover and follow-up systems",
      "Pipeline review and opportunity progression",
      "Sales and marketing alignment",
    ],
  },
  {
    title: "Technology & Vendor Advisory",
    category: "growth",
    summary:
      "Deciding what you actually need before anyone sells you a platform.",
    icon: "lucide:clipboard-check",
    boundary:
      "We help define requirements and choose a vendor. The selected vendor performs the implementation, not DAIT.",
    points: [
      "Business requirements definition",
      "Vendor evaluation criteria",
      "Technology-partner shortlisting",
      "Comparing ERP, CRM, SaaS, AI and industrial software providers",
      "Discovery and evaluation meeting support",
      "Decision-making frameworks",
    ],
  },
  {
    title: "Corporate Training & Growth Coaching",
    category: "growth",
    summary:
      "Building capability inside your team so the improvement outlasts the engagement.",
    icon: "lucide:users-round",
    points: [
      "B2B marketing workshops",
      "ABM and enterprise prospecting",
      "SEO and demand-generation training",
      "Sales enablement",
      "AI-enabled marketing productivity",
      "Leadership coaching for marketing and sales teams",
    ],
  },
  {
    title: "AI & Machine Learning Consulting",
    summary:
      "Working out where AI genuinely pays back in your operation, and what has to be true before it will.",
    icon: "lucide:brain-circuit",
    category: "technology",
    boundary:
      "We identify, prioritise and govern the use cases. Model building and deployment runs with your team or an implementation partner.",
    points: [
      "Use-case discovery and prioritisation against business value",
      "Data readiness assessment — whether your data can support the idea",
      "Build, buy or partner decisions, with the cost of each",
      "Proof-of-concept scoping and success criteria agreed up front",
      "Model governance, risk and acceptable-use policy",
      "Capability plan so the work does not depend on one hire",
    ],
  },
  {
    title: "Generative AI Consulting",
    summary:
      "Where large language models actually help a business, and where they quietly create risk.",
    icon: "lucide:sparkles",
    category: "technology",
    boundary:
      "We define the use case, the guardrails and how it gets evaluated. Build and integration stays with your team or a partner.",
    points: [
      "Opportunity mapping across support, sales, operations and documentation",
      "Retrieval, prompting or fine-tuning — which the problem actually needs",
      "Data privacy, confidentiality and IP boundaries before anything is sent",
      "Staff acceptable-use policy and review process",
      "Model and vendor selection, including what running it will cost",
      "Pilot design with a measurable definition of working",
    ],
  },
  {
    title: "Digital Transformation Consulting",
    summary:
      "A sequenced plan for changing how the business runs — not a platform purchase with a new name.",
    icon: "lucide:refresh-ccw",
    category: "technology",
    boundary:
      "We assess, sequence and build the business case. Delivery runs with your team and the vendors you select.",
    points: [
      "Current-state assessment across process, systems and people",
      "Process mapping and where the time and money actually go",
      "Technology roadmap with phasing, so nothing goes big-bang",
      "Business case and ROI model your board can test",
      "Change management and adoption planning",
      "Governance: who decides what, and how progress is reviewed",
    ],
  },
  {
    title: "Cloud & DevOps Consulting",
    summary:
      "Whether to move, what to move first, what it will cost to run, and how releases stop being events.",
    icon: "lucide:cloud",
    category: "technology",
    boundary:
      "We assess and plan. Migration and pipeline engineering is performed by your team or the managed service provider you appoint.",
    points: [
      "Cloud readiness assessment and migration sequencing",
      "Architecture and landing-zone review against your actual workloads",
      "Run-cost modelling and ongoing cost control",
      "CI/CD and release maturity assessment",
      "Managed service provider evaluation and selection",
      "Internal capability plan so you are not locked to one vendor",
    ],
  },
  {
    title: "Data & Analytics Consulting",
    summary:
      "Getting to one version of the numbers, and making sure the ones on the dashboard are the ones that matter.",
    icon: "lucide:chart-column",
    category: "technology",
    boundary:
      "We define the model, the metrics and the tooling. Pipeline and dashboard build runs with your team or a partner.",
    points: [
      "Data maturity assessment across sources, quality and ownership",
      "Defining the metrics the business will actually be run on",
      "Warehouse and BI platform evaluation",
      "Reporting governance and a single source of truth",
      "Analytics operating model — who owns what, and who answers questions",
      "Team capability and training plan",
    ],
  },
  {
    title: "Application Modernisation Consulting",
    summary:
      "Deciding what to do with the systems the business depends on and nobody wants to touch.",
    icon: "lucide:layers",
    category: "technology",
    boundary:
      "We assess the portfolio and recommend the route. Re-engineering and migration is delivered by your team or a partner.",
    points: [
      "Application portfolio assessment — cost, risk and business criticality",
      "Rehost, replatform, refactor or replace, decided per application",
      "Integration and data migration planning",
      "Phasing that keeps the business running throughout",
      "Build-versus-buy for replacements, and vendor shortlisting",
      "Business case covering the cost of doing nothing",
    ],
  },
  {
    title: "SAP Consulting",
    summary:
      "Advisory for businesses evaluating, scoping or governing an SAP programme — before and alongside the implementation partner.",
    icon: "lucide:database",
    category: "technology",
    boundary:
      "DAIT is NOT an SAP implementation partner and does not configure SAP. We help define requirements, evaluate and select a certified partner, and govern the programme on your side of the table.",
    points: [
      "Readiness and fit-gap assessment against how you actually operate",
      "S/4HANA migration decision support, including whether to wait",
      "Module and scope definition before a quote is requested",
      "Systems-integrator evaluation, shortlisting and commercial comparison",
      "Business case and total cost of ownership over the full term",
      "Programme governance and change management for your team",
    ],
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
