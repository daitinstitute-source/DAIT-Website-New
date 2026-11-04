/**
 * The counselling chatbot, with no hosting platform baked in.
 *
 * Same split as src/lib/leads.ts: the work lives here, each host gets a thin
 * adapter (api/chat.ts for Vercel, functions/api/chat.ts for Cloudflare, plus
 * the dev bridge in astro.config.mjs). Moving hosts must never mean rewriting
 * this file.
 *
 * Shape of a request:
 *   1. Validate + cap (turns, length, origin) — this endpoint spends money per
 *      call, so the caps are a cost control, not just hygiene
 *   2. Stream a reply from Claude over SSE, with the knowledge pack cached
 *   3. If the visitor asks for a callback, Claude calls `request_callback`,
 *      and we file a STANDARD lead through handleLead() — the same pipeline,
 *      Brevo contact and deal as every form on the site
 *
 * WHAT THIS BOT MAY NOT DO, and why it is enforced here rather than trusted to
 * the prompt alone:
 *   • Quote a course fee. siteConfig.display.showFees is false and several
 *     programs ship with no fee on purpose. The generator never puts a fee in
 *     the knowledge pack, so there is no number to repeat.
 *   • Promise a job or a placement rate. The career-outcome figures are market
 *     averages and the pages say so; the prompt makes the bot say so too.
 *   • Mention or link the student portal. It exists, it is an inclusion, and it
 *     is deliberately unlinked everywhere — see src/data/navigation.ts.
 *
 * Required env:  ANTHROPIC_API_KEY  (+ everything src/lib/leads.ts needs, since
 *                a captured callback goes through that pipeline)
 * Optional env:  CHAT_MODEL, CHAT_ALLOWED_ORIGIN
 */
import Anthropic from "@anthropic-ai/sdk";
import { handleLead, type Env as LeadEnv, type LeadPayload } from "./leads.js";
import { knowledgePack, programIndex } from "./chat-knowledge.generated.js";

export interface Env extends LeadEnv {
  ANTHROPIC_API_KEY?: string;
  /** Override the model without a deploy. Defaults to Claude Opus 5.5. */
  CHAT_MODEL?: string;
  /** Comma-separated origins allowed to call this endpoint. */
  CHAT_ALLOWED_ORIGIN?: string;
}

/** One turn of the visible conversation. Thinking never crosses the wire. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages?: ChatTurn[];
  /** Page the widget is open on — gives the bot context and tags the lead. */
  page?: string;
  /** First-party session signals, mirrored from the BaseLayout tracker. */
  session?: Record<string, unknown>;
}

/**
 * Engagement fields we accept from the browser, and nothing else.
 *
 * `session` is client-supplied, so spreading it into a LeadPayload would let a
 * crafted request set any field on the record — including ones the pipeline
 * treats as trustworthy. Copy the known keys across and drop the rest.
 */
const SESSION_KEYS = [
  "leadSource",
  "landingPage",
  "pagesViewed",
  "timeOnSiteSec",
  "visitor",
  "visitNumber",
  "referrer",
] as const;

function pickSession(session: Record<string, unknown> = {}): Partial<LeadPayload> {
  const out: Record<string, unknown> = {};
  for (const k of SESSION_KEYS) {
    const v = session[k];
    if (typeof v === "string") out[k] = v.slice(0, 300);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out as Partial<LeadPayload>;
}

/* ----------------------------------------------------------------- limits */

/**
 * A public, unauthenticated endpoint that calls a paid API is a money tap, so
 * every one of these is a spend cap first and a UX rule second. They are
 * enforced per request, which works without any shared store — unlike per-IP
 * rate limiting, which genuinely needs one (see the note on checkBurst below).
 */
const LIMITS = {
  /** Longest single message. Generous for a question, far short of a paste-bomb. */
  messageChars: 1500,
  /** Turns kept. The knowledge pack answers most things; long threads mean a human should take over. */
  maxTurns: 24,
  /** Total history sent. Backstop for many medium messages. */
  historyChars: 24_000,
  /** Reply cap. Chat answers are short by design — see the brevity rule in the prompt. */
  maxTokens: 1024,
} as const;

const MODEL_DEFAULT = "claude-opus-5-5";

/* ------------------------------------------------------------ system prompt */

const programList = programIndex.map((p) => `${p.slug} (${p.title})`).join(", ");

/**
 * The stable, cached half of every request. Byte-stability matters: this string
 * plus the knowledge pack is the cache prefix, and any change to it invalidates
 * the cache for every visitor. Keep per-request detail (the page, the time) OUT
 * of here — it goes in the messages instead.
 */
const SYSTEM_RULES = `You are the career counselling assistant for DAIT Institute, an IT training institute in Chhatrapati Sambhajinagar (Sambhaji Nagar), Maharashtra, India.

You talk to two kinds of people, and you must never assume which one you have until they tell you:
- Fresh graduates and final-year students looking for a first job.
- Working professionals upskilling, switching careers, or chasing a salary rise.

## How you talk
- Short. Two or three sentences for most answers. This is a chat window, not a brochure. Never send a wall of text.
- Plain, warm, direct. No corporate filler, no exclamation marks, no emoji.
- One question at a time. Counselling is a conversation, not a form.
- Many visitors write in Hinglish or Marathi-influenced English. Understand it, and reply in simple English unless they clearly want otherwise.
- Never use the words "industry-ready" or "unlock your potential". Say the concrete thing instead.

## Honesty rules — these override being helpful or persuasive
1. NEVER state a course fee, a price, a discount or an EMI figure. You do not have this information. Say fees are gone through in the free counselling session, and offer to arrange a callback.
2. NEVER promise a job, a placement, a salary, or a success rate. DAIT offers placement SUPPORT — mentoring, portfolio and interview preparation, job-board access — not a guarantee. When you quote any salary figure from your knowledge, you must say in the same breath that it is a market average for that role in India, not a DAIT guarantee.
3. NEVER invent anything. Course duration, batch dates, instructor names, student stories, student counts, partner companies, certifications — if it is not in your knowledge below, say you do not have it and offer to have a counsellor confirm.
4. If DAIT is not the right answer for someone, say so plainly. Someone who wants a government job, a degree, a course DAIT does not run, or who would be better served elsewhere deserves a straight answer. This is explicitly how DAIT counsels; a dishonest yes costs more than a lost lead.
5. Be genuinely useful about the IT job market as a whole, not only about DAIT's own programs. The published guides exist to help people choose a career honestly, including paths DAIT does not teach. Use them that way.
6. NEVER mention, link, or hint at a student portal, login, or dashboard URL. Enrolled students are given access directly. If asked about logging in, say the institute provides access after enrolment and offer a callback.

## What you are for
Help the visitor work out what fits them, using the programs and guides below. Ask about their background, what they enjoy, and what they want next. Recommend a specific program when one genuinely fits, and link it as /programs/<slug>/. Point to a guide at /blog/<slug>/ when it answers them better.

## Getting a counsellor involved
DAIT's enrolment journey starts with a FREE aptitude and interest check, then a free counselling conversation. There is no pass or fail and no obligation. Offer this when:
- the visitor asks about fees, admission, batches, or to talk to someone
- they are torn between programs, or unsure anything fits
- the conversation has gone several turns and a person would serve them better

To arrange it, call the \`request_callback\` tool. Collect the details conversationally, never as a list of fields:
- their name and phone number are REQUIRED — do not call the tool without both
- ask which program interests them, if it is not already obvious from the conversation
- work out from what they have told you whether they are a graduate or a working professional; ask only if it is genuinely unclear

Ask for the phone number once, naturally, when they have shown real interest. If they say no, drop it and carry on being useful — never ask twice in a row, and never make the number a condition of answering.

After the tool succeeds, confirm warmly in one line that a counsellor will call, and say roughly when (same or next working day).

Valid program slugs: ${programList}, or "general" when it is not program-specific.

# Knowledge

Everything you know about DAIT is below. It is generated from the live website, so it is current. If something is not here, you do not know it.

`;

/** The system blocks, assembled once. The cache breakpoint sits at the end. */
const systemBlocks: Anthropic.TextBlockParam[] = [
  {
    type: "text",
    text: SYSTEM_RULES + knowledgePack,
    // ~9K tokens of knowledge on every turn. Cached, repeat turns cost ~a tenth.
    cache_control: { type: "ephemeral" },
  },
];

/* -------------------------------------------------------------------- tool */

const callbackTool: Anthropic.Tool = {
  name: "request_callback",
  description:
    "File a callback request so a DAIT counsellor can phone this visitor about free career counselling. Call this ONLY when you have both their name and their phone number, and they have agreed to be contacted. Never call it speculatively.",
  // strict guarantees the arguments validate, so the lead we file is well-formed.
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", description: "The visitor's name, as they gave it." },
      phone: {
        type: "string",
        description: "Phone number exactly as the visitor typed it. Do not reformat or invent digits.",
      },
      email: { type: "string", description: "Email if they offered one; empty string if not." },
      programInterest: {
        type: "string",
        description: `Program slug they are interested in: one of ${programList}, or "general".`,
      },
      audienceType: {
        type: "string",
        enum: ["graduate", "working-professional", "other"],
        description: "Which they are, based on what they told you. Use \"other\" if genuinely unclear.",
      },
      summary: {
        type: "string",
        description:
          "Two or three sentences for the counsellor: who this person is, what they want, what they are weighing up, and anything they asked that you could not answer.",
      },
    },
    required: ["name", "phone", "email", "programInterest", "audienceType", "summary"],
  },
};

/* --------------------------------------------------------------- validation */

export interface ChatRejection {
  status: number;
  message: string;
}

/**
 * Best-effort burst guard.
 *
 * Serverless instances are not shared, so this only catches a flood that lands
 * on the same warm instance — which is the common case for a single abusive
 * client, but NOT a real rate limiter. A durable one needs a shared store
 * (Vercel KV, Upstash); until then the per-request caps above are what actually
 * bounds the spend. Documented rather than dressed up.
 */
const burst = new Map<string, number[]>();
const BURST_WINDOW_MS = 60_000;
const BURST_MAX = 12;

function checkBurst(key: string): boolean {
  const now = Date.now();
  const hits = (burst.get(key) ?? []).filter((t) => now - t < BURST_WINDOW_MS);
  hits.push(now);
  burst.set(key, hits);
  if (burst.size > 500) burst.clear(); // crude ceiling; this map must never grow unbounded
  return hits.length <= BURST_MAX;
}

/**
 * Rejects what should never reach the model. Returns null when the request is
 * fine. Origin is checked when CHAT_ALLOWED_ORIGIN is set — unset means allow,
 * so local dev and preview deploys work without configuration.
 */
export function validateChat(
  req: ChatRequest,
  env: Env,
  origin?: string,
  clientKey = "anon",
): ChatRejection | null {
  if (!env.ANTHROPIC_API_KEY) {
    return { status: 503, message: "Chat is not configured." };
  }

  const allowed = (env.CHAT_ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length && origin && !allowed.includes(origin)) {
    return { status: 403, message: "Not allowed from this origin." };
  }

  const messages = req.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, message: "No messages." };
  }
  if (messages.length > LIMITS.maxTurns) {
    return {
      status: 400,
      message: "This conversation has run long. Please start a new one, or ask us to call you.",
    };
  }
  if (messages[messages.length - 1]?.role !== "user") {
    return { status: 400, message: "Last message must be from the visitor." };
  }

  let total = 0;
  for (const m of messages) {
    if (typeof m?.content !== "string" || (m.role !== "user" && m.role !== "assistant")) {
      return { status: 400, message: "Malformed message." };
    }
    if (m.content.length > LIMITS.messageChars) {
      return { status: 400, message: "That message is too long — could you shorten it?" };
    }
    total += m.content.length;
  }
  if (total > LIMITS.historyChars) {
    return { status: 400, message: "This conversation has run long. Please start a new one." };
  }

  if (!checkBurst(clientKey)) {
    return { status: 429, message: "Too many messages just now. Give it a moment." };
  }

  return null;
}

/* ------------------------------------------------------------------ the run */

const enc = new TextEncoder();
const sse = (event: string, data: unknown) =>
  enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

/**
 * Turn a captured callback into a STANDARD lead and push it through the
 * existing pipeline. Field names are the contract (see CLAUDE.md) — the only
 * thing marking it as chat-sourced is `source` and the `extra` block, so it
 * lands in Brevo beside every other lead instead of in a parallel world.
 */
async function fileCallback(
  input: Record<string, unknown>,
  req: ChatRequest,
  env: Env,
): Promise<boolean> {
  const s = (k: string) => String(input[k] ?? "").trim();
  const lead: LeadPayload = {
    ...pickSession(req.session),
    name: s("name"),
    phone: s("phone"),
    email: s("email") || undefined,
    programInterest: s("programInterest") || "general",
    audienceType: s("audienceType") || "other",
    message: s("summary"),
    source: req.page || "/",
    submittedAt: new Date().toISOString(),
    extra: {
      form: "Website chatbot",
      channel: "chatbot",
      capturedBy: "AI counselling assistant",
      ...(s("summary") ? { chatSummary: s("summary") } : {}),
    },
  };

  try {
    const { body } = await handleLead(lead, env);
    return body.ok;
  } catch {
    return false; // never fail the conversation because the CRM hiccuped
  }
}

/**
 * Runs one turn and returns an SSE stream.
 *
 * Events: `text` (delta), `lead` (callback filed), `done` (usage), `error`.
 * The loop runs at most twice — once for the reply, once more after a tool
 * call so Claude can confirm the callback in its own words.
 */
export async function streamChat(req: ChatRequest, env: Env): Promise<ReadableStream<Uint8Array>> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.CHAT_MODEL || MODEL_DEFAULT;

  // Per-request context goes here, AFTER the cached prefix, so it never
  // invalidates the cache.
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `[Context — not from the visitor. They are reading ${req.page || "the site"}. Today is ${new Date().toISOString().slice(0, 10)}.]`,
    },
    {
      role: "assistant",
      content: "Understood — I'll keep that in mind and won't mention it.",
    },
    ...(req.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
  ];

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: string, d: unknown) => controller.enqueue(sse(e, d));
      try {
        for (let pass = 0; pass < 2; pass++) {
          // eager_input_streaming is deliberately OFF: the tool's input is a
          // handful of short strings, so there is nothing worth streaming, and
          // buffering keeps the SDK's validation rather than handing it to us.
          const stream = client.messages.stream({
            model,
            max_tokens: LIMITS.maxTokens,
            system: systemBlocks,
            messages,
            tools: [callbackTool],
            // Chat is the workload effort is lowest-risk on, and it keeps the
            // widget feeling instant. Raise if answers get thin.
            output_config: { effort: "low" },
          });

          stream.on("text", (delta) => send("text", { t: delta }));

          const final = await stream.finalMessage();

          if (final.stop_reason === "refusal") {
            send("error", {
              message:
                "Sorry — I can't help with that one. I can tell you about DAIT's programs, or arrange a callback.",
            });
            break;
          }

          const toolUse = final.content.find(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (!toolUse) {
            send("done", {
              usage: {
                input: final.usage.input_tokens,
                output: final.usage.output_tokens,
                cacheRead: final.usage.cache_read_input_tokens ?? 0,
                cacheWrite: final.usage.cache_creation_input_tokens ?? 0,
              },
            });
            break;
          }

          const ok = await fileCallback(
            toolUse.input as Record<string, unknown>,
            req,
            env,
          );
          send("lead", { ok });

          messages.push({ role: "assistant", content: final.content });
          messages.push({
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUse.id,
                is_error: !ok,
                content: ok
                  ? "Callback request filed. Confirm to the visitor in one short line that a counsellor will call them, same or next working day."
                  : "Could not file the request. Apologise briefly, and give them the phone number and WhatsApp on the contact page instead.",
              },
            ],
          });
        }
      } catch (err) {
        // Typed, most-specific first — a rate limit and a bad key are different
        // problems and the visitor should not see either one's wording.
        let message = "Something went wrong at our end. Please try again, or use the contact page.";
        if (err instanceof Anthropic.RateLimitError) {
          message = "We're a bit busy right now — try again in a moment.";
        } else if (err instanceof Anthropic.AuthenticationError) {
          message = "Chat is temporarily unavailable. Please use the contact page.";
        }
        console.error("[chat]", err instanceof Error ? err.message : err);
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });
}
