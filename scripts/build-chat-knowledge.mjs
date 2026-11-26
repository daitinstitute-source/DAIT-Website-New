/**
 * build-chat-knowledge.mjs — compiles the chatbot's knowledge pack from the
 * SAME content collections the public pages render from.
 *
 * Why generate instead of hand-writing a prompt: a hand-maintained knowledge
 * blob drifts. Someone edits a syllabus in the MDX, the page updates, and the
 * bot carries on quoting last quarter's modules to a prospective student. The
 * only safe source of truth is the content files themselves.
 *
 * Why a build step rather than getCollection(): `api/chat.ts` is built by Vercel
 * independently of the Astro build (same reason api/leads.ts exists — see its
 * header), so `astro:content` is unreachable from the function. This script
 * parses the frontmatter directly and emits a plain .ts module the function can
 * import like any other file.
 *
 * The OUTPUT IS COMMITTED. That keeps the function build from depending on this
 * script having run on the host, and it means a knowledge change shows up as a
 * reviewable diff rather than happening invisibly at deploy time.
 *
 * Run: npm run chat:knowledge   (also wired into `npm run build`)
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "src", "lib", "chat-knowledge.generated.ts");

/** Split `---\n<yaml>\n---\n<body>` without pulling in gray-matter. */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return parseYaml(m[1]);
}

function readCollection(name) {
  const dir = join(root, "src", "content", name);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const data = frontmatter(readFileSync(join(dir, f), "utf8"));
      return data ? { slug: f.replace(/\.mdx$/, ""), ...data } : null;
    })
    .filter((e) => e && !e.draft);
}

const list = (arr) => (arr ?? []).map((x) => `- ${x}`).join("\n");

/**
 * One program, rendered for the model.
 *
 * Deliberately omits `fee` even when a program defines one. The bot is not
 * allowed to quote fees (siteConfig.display.showFees is false and several
 * programs ship without a fee on purpose), and the surest way to stop a model
 * repeating a number is to never put the number in its context.
 */
function renderProgram(p) {
  const out = [];
  out.push(`### ${p.title}`);
  out.push(`- URL: /programs/${p.slug}/`);
  out.push(`- Area: ${p.area}`);
  out.push(`- One-line: ${p.tagline}`);
  out.push(`- Level: ${p.level}`);
  out.push(`- Delivery modes: ${(p.mode ?? []).join(", ")}`);
  out.push(`- Suits: ${(p.audience ?? []).join(", ")}`);
  out.push(`- Batch options: ${(p.batchOptions ?? []).join(" / ")}`);
  if (p.duration) out.push(`- Duration: ${p.duration}`);
  if (p.batchSize) out.push(`- Batch size: ${p.batchSize}`);
  if (p.certification) out.push(`- Certification: ${p.certification}`);

  if (p.highlights?.length) out.push(`\n**Highlights**\n${list(p.highlights)}`);
  if (p.eligibility?.length) out.push(`\n**Who can join**\n${list(p.eligibility)}`);
  if (p.prerequisites?.length) out.push(`\n**Prerequisites**\n${list(p.prerequisites)}`);
  if (p.tools?.length) out.push(`\n**Tools covered**: ${p.tools.join(", ")}`);

  if (p.syllabus?.length) {
    const mods = p.syllabus
      .map((m) => `- **${m.module}**\n${(m.topics ?? []).map((t) => `  - ${t}`).join("\n")}`)
      .join("\n");
    out.push(`\n**Curriculum (foundation track — for beginners/freshers)**\n${mods}`);
  }

  if (p.professionalTrack) {
    const pt = p.professionalTrack;
    const seg = [`\n**Advanced track (working professionals)**`];
    if (pt.tagline) seg.push(`- ${pt.tagline}`);
    if (pt.duration) seg.push(`- Duration: ${pt.duration}`);
    if (pt.workSkills?.length) seg.push(`- Skills applied at work:\n${(pt.workSkills).map((s) => `  - ${s}`).join("\n")}`);
    if (pt.syllabus?.length) {
      seg.push(
        `- Modules:\n${pt.syllabus.map((m) => `  - ${m.module}: ${(m.topics ?? []).join("; ")}`).join("\n")}`,
      );
    }
    out.push(seg.join("\n"));
  }

  if (p.outcomes?.length) out.push(`\n**Job roles this leads to**\n${list(p.outcomes)}`);

  /**
   * The detailed roles, which replaced the salary bands on the page. Worth the
   * tokens: "what does a BI Analyst actually do" is one of the questions a
   * counselling bot gets most, and the answer now exists in the content rather
   * than having to be improvised.
   */
  if (p.jobRoles?.length) {
    const roles = p.jobRoles
      .map((r) => {
        const bits = [`- **${r.title}**${r.level ? ` (${r.level})` : ""}: ${r.summary}`];
        if (r.responsibilities?.length) {
          bits.push(`  Day to day: ${r.responsibilities.join("; ")}`);
        }
        if (r.tools?.length) bits.push(`  Tools: ${r.tools.join(", ")}`);
        if (r.hires) bits.push(`  Who hires: ${r.hires}`);
        return bits.join("\n");
      })
      .join("\n");
    out.push(
      `\n**What these roles actually involve**\n` +
        `(Describe the work. Salary figures were deliberately removed from this site — ` +
        `if asked about pay, say it depends on the employer and the portfolio, and offer counselling.)\n${roles}`,
    );
  }

  if (p.careerOutcomes?.length) {
    const co = p.careerOutcomes
      .map((c) => {
        const items = (c.items ?? []).map((i) => `  - ${i}`).join("\n");
        // The salary note matters more than the numbers: it is the disclaimer
        // the page shows, and the bot must repeat it rather than drop it.
        return `- ${c.category}:\n${items}${c.note ? `\n  NOTE (must be repeated if you quote these): ${c.note}` : ""}`;
      })
      .join("\n");
    out.push(`\n**Career outcomes**\n${co}`);
  }

  if (p.faqs?.length) {
    out.push(`\n**Program FAQs**\n${p.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}`);
  }

  return out.join("\n");
}

/**
 * Blog posts go in as title + description + FAQ pairs, not full bodies. The
 * posts are long, and their FAQs already hold the answerable facts in the
 * compact form a conversation needs. Full MDX bodies would multiply the cached
 * prefix for very little extra answering power.
 */
function renderPost(b) {
  const parts = [`### ${b.title}`, `- URL: /blog/${b.slug}/`, `- Summary: ${b.description}`];
  if (b.faqs?.length) {
    parts.push(b.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n"));
  }
  return parts.join("\n");
}

const programs = readCollection("programs").sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const posts = readCollection("blog");
const consulting = readCollection("consulting").sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

/**
 * Consulting goes in SHORT.
 *
 * The bot's job is career counselling for individuals, and a business buyer is
 * a different conversation entirely. But a visitor asking "do you do SAP
 * consulting?" should not be told no, so it gets enough to confirm the service
 * exists, state the scope boundary, and hand over the page — not enough to
 * start advising on an enterprise programme.
 */
function renderConsulting(c) {
  return [
    `### ${c.title}`,
    `- URL: /business-consulting/${c.slug}/`,
    `- What it is: ${c.tagline}`,
    `- SCOPE LIMIT (always state this if asked): ${c.boundary}`,
  ].join("\n");
}

const knowledge = [
  `## DAIT Institute programs (${programs.length})`,
  programs.map(renderProgram).join("\n\n"),
  `\n## Business consulting (B2B — a different audience from course enquiries)`,
  `DAIT also advises companies. This is NOT training and not for individual learners. If someone asks about these, confirm the service exists, state its scope limit honestly, and point them at the page or the consulting enquiry form at /business-consulting/. Do not advise on an engagement yourself, and do not quote prices.`,
  consulting.map(renderConsulting).join("\n\n"),
  `\n## Published guides on daitinstitute.com`,
  `Written to be useful about the whole IT job market, not only DAIT's own programs. Cite and link them when they answer the question better than a sales reply would.`,
  posts.map(renderPost).join("\n\n"),
].join("\n\n");

const index = programs.map((p) => ({ slug: p.slug, title: p.title, area: p.area }));

const banner = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Produced by scripts/build-chat-knowledge.mjs from src/content/{programs,blog}.
 * Run \`npm run chat:knowledge\` after changing program or blog frontmatter.
 */`;

writeFileSync(
  OUT,
  `${banner}

/** Every non-draft program, for the qualification tool's enum and for routing. */
export const programIndex = ${JSON.stringify(index, null, 2)} as const;

/** The cached prefix of every chat request. Keep it byte-stable — see src/lib/chat.ts. */
export const knowledgePack = ${JSON.stringify(knowledge)};
`,
  "utf8",
);

const kb = (knowledge.length / 1024).toFixed(1);
console.log(
  `chat knowledge: ${programs.length} programs, ${posts.length} posts -> ${kb} KB (~${Math.round(knowledge.length / 4)} tokens)`,
);
