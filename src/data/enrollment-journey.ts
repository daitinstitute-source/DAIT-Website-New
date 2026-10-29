/**
 * enrollment-journey.ts — the five steps from first enquiry to first project.
 *
 * Identical for every program, so it lives here and ProgramLayout renders it on
 * all of them. Change a step once and it updates across the site.
 *
 * COPY NOTES — these wordings are deliberate, not decoration:
 *   • "Aptitude & interest check", not "pre-admission test". A test implies a
 *     pass mark and the risk of rejection, which is the single biggest reason a
 *     nervous first-time enquirer stops reading. The step is framed as
 *     something that helps THEM choose, because that is what it is for.
 *   • "Confirm your seat", not "Enroll". Lower friction, and it reflects the
 *     real mechanic — batches are capped (see batchSize in the program files),
 *     so a seat genuinely is held.
 *   • "Start building", not "Start learning". Project-first is the actual
 *     differentiator against watching recorded lectures; say it.
 *
 * Confirmed 2026-10-29: the aptitude check is free, and every enrolled student
 * gets lifetime access to the items in `seatIncludes` below.
 *
 * ⚠️ The student portal is NOT built yet — siteConfig.portalUrl is marked
 *   "not built yet" and the Student Login nav slot is still hidden behind
 *   comingSoon. Listing it here is a promise with a delivery date attached.
 *   `portalLive` gates that one item, so it can be held back without losing
 *   the other three. Flip it when the portal actually exists.
 */

export interface JourneyStep {
  title: string;
  body: string;
  /** Short reassurance chip — the objection this step quietly answers. */
  note?: string;
  icon: string;
}

export const enrollmentJourney: JourneyStep[] = [
  {
    title: "Aptitude & interest check",
    body: "A short, free check of where your strengths sit and which subjects hold your attention. It exists to help you choose, not to filter you out.",
    note: "Free · no pass or fail",
    icon: "lucide:clipboard-list",
  },
  {
    title: "Career counselling",
    body: "Talk it through with an advisor, in person or online. Your background, where you want to get to, and what employers here are actually hiring for.",
    note: "No obligation",
    icon: "lucide:messages-square",
  },
  {
    title: "Your program fit",
    body: "We recommend the track, the batch and the depth that match your situation — and we will say so plainly if none of ours is the right choice for you.",
    note: "Honest answer",
    icon: "lucide:target",
  },
  {
    title: "Confirm your seat",
    body: "Pick the batch that fits your week and complete admission. Cohorts are capped, so your place is held once it is confirmed.",
    note: "Capped batches",
    icon: "lucide:check-circle-2",
  },
  {
    title: "Start building",
    body: "Day one is hands-on. You start building from the first week, so your portfolio grows through the course rather than being bolted on at the end.",
    note: "Project from week one",
    icon: "lucide:rocket",
  },
];

export const journeyIntro =
  "Five steps, and nothing is committed until you choose a seat. The first conversations are about working out whether this is right for you at all.";

/* ------------------------------------------------- what a seat includes */

/**
 * Flip to true when portal.daitinstitute.com is live. While false the portal
 * line is simply not shown, so the page never promises a product that does
 * not exist yet — the other three are available from day one.
 */
export const portalLive = false;

export interface SeatInclude {
  label: string;
  icon: string;
  /** Only rendered once the portal is live. */
  needsPortal?: boolean;
}

const allIncludes: SeatInclude[] = [
  { label: "Student portal access", icon: "lucide:layout-dashboard", needsPortal: true },
  { label: "Masterclasses", icon: "lucide:presentation" },
  { label: "Industry mentor sessions", icon: "lucide:handshake" },
  { label: "AI workshops", icon: "lucide:sparkles" },
];

export const seatIncludes = allIncludes.filter((i) => portalLive || !i.needsPortal);

export const seatIncludesLabel = "Lifetime access, included with every seat";

