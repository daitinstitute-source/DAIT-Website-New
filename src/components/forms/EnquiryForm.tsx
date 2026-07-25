/**
 * EnquiryForm — React island for on-page lead capture.
 * Posts the STANDARD lead payload (see CLAUDE.md "Lead Pipeline") to /api/leads,
 * then redirects to /thank-you. Field names are the contract — do not rename.
 *
 * Renders on program pages (programSlug prefilled) and the contact page (general).
 * Honeypot ("company") + timing check happen server-side; we just include the field.
 */
import { useState, type FormEvent } from "react";

interface Props {
  programSlug?: string;
  programTitle?: string;
  /** Visual variant: "card" (light card, default) or "bare" (no card chrome). */
  variant?: "card" | "bare";
  /** Slim inline form: name + phone + submit only (e.g. "Book a visit" band). */
  compact?: boolean;
  /**
   * When set (and no fixed programSlug), renders a "Program of interest"
   * dropdown. Used on the contact page so a general enquirer can pick a program.
   * List comes from the content collection at render time.
   */
  programs?: Array<{ slug: string; title: string }>;
  /** Override the card heading/subheading (e.g. "Request a Callback" in the hero). */
  heading?: string;
  subheading?: string;
  /** Hide the optional message textarea to keep the form short (e.g. in the hero). */
  hideMessage?: boolean;
}

type Status = "idle" | "submitting" | "error";

const AUDIENCE_OPTIONS = [
  { value: "graduate", label: "Fresh graduate / student" },
  { value: "working-professional", label: "Working professional" },
  { value: "other", label: "Business owner / other" },
];

/**
 * First-party engagement snapshot for the lead — read from the session tracker
 * that BaseLayout maintains (main source, landing page, pages viewed, time on
 * site, new/returning). No campaign UTMs; all behavioural.
 */
function readEngagement() {
  const here = typeof window !== "undefined" ? window.location.pathname : "";
  const base = {
    leadSource: "Direct",
    landingPage: here,
    conversionPage: here,
    pagesViewed: 1,
    timeOnSiteSec: 0,
    visitor: "new",
    visitNumber: 1,
    referrer: "",
  };
  if (typeof window === "undefined") return base;

  let s: Record<string, unknown> = {};
  try {
    s = JSON.parse(sessionStorage.getItem("dait_sess") ?? "{}") ?? {};
  } catch {
    s = {};
  }
  const start = Number(s.start) || Date.now();
  const visit = Number(s.visit) || 1;

  return {
    leadSource: (s.source as string) || "Direct",
    landingPage: (s.landing as string) || here,
    conversionPage: here,
    pagesViewed: Number(s.pages) || 1,
    timeOnSiteSec: Math.max(0, Math.round((Date.now() - start) / 1000)),
    visitor: visit > 1 ? "returning" : "new",
    visitNumber: visit,
    referrer: (s.referrer as string) || (typeof document !== "undefined" ? document.referrer : ""),
  };
}

export default function EnquiryForm({
  programSlug,
  programTitle,
  variant = "card",
  compact = false,
  programs,
  heading,
  subheading,
  hideMessage = false,
}: Props) {
  // Show the program picker only on general enquiry forms (no fixed program).
  const showProgramPicker = !programSlug && !!programs?.length;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const eng = readEngagement();
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      programInterest:
        programSlug ?? String(fd.get("programInterest") ?? "general"),
      audienceType: String(fd.get("audienceType") ?? "other"),
      message: String(fd.get("message") ?? "").trim(),
      company: String(fd.get("company") ?? ""), // honeypot — must stay empty
      source: eng.conversionPage, // page the form was submitted on
      leadSource: eng.leadSource,
      landingPage: eng.landingPage,
      pagesViewed: eng.pagesViewed,
      timeOnSiteSec: eng.timeOnSiteSec,
      visitor: eng.visitor,
      visitNumber: eng.visitNumber,
      referrer: eng.referrer,
      submittedAt: new Date().toISOString(),
    };

    if (!payload.name || !payload.phone) {
      setStatus("error");
      setError("Please share at least your name and phone number.");
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      window.location.href = "/thank-you/";
    } catch (err) {
      setStatus("error");
      setError(
        "Something went wrong sending your enquiry. Please try WhatsApp or call us instead.",
      );
    }
  }

  const wrap =
    variant === "card"
      ? "rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm"
      : "";

  const field =
    "mt-1.5 w-full rounded-xl border border-border bg-surface-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-ink-500";

  const compactInput =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition";

  if (compact) {
    return (
      <div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
          {/* Honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </div>
          <input name="name" type="text" required autoComplete="name" placeholder="Full name"
            aria-label="Full name" className={compactInput} />
          <input name="phone" type="tel" required autoComplete="tel" placeholder="Phone / WhatsApp"
            aria-label="Phone number" className={compactInput} />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-orange-500 bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-600 hover:bg-orange-600 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
          >
            {status === "submitting" ? "Sending…" : "Book my visit"}
          </button>
        </form>
        {status === "error" && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={wrap}>
      {programTitle && (
        <p className="text-xs font-bold uppercase tracking-wider text-accent-600">
          Enquire · {programTitle}
        </p>
      )}
      <h3 className="mt-1 text-2xl font-bold text-ink-900">
        {heading ?? "Talk to a career advisor"}
      </h3>
      <p className="mt-2 text-sm text-ink-500">
        {subheading ??
          "Share a few details and an advisor will call you back with cohort dates, fees, and the right track for your goals."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {/* Honeypot — visually hidden, bots fill it, humans don't */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ef-name" className={labelCls}>
              Full name
            </label>
            <input id="ef-name" name="name" type="text" required autoComplete="name"
              placeholder="Your name" className={field} />
          </div>
          <div>
            <label htmlFor="ef-phone" className={labelCls}>
              Phone / WhatsApp
            </label>
            <input id="ef-phone" name="phone" type="tel" required autoComplete="tel"
              placeholder="+91 …" className={field} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ef-email" className={labelCls}>
              Email <span className="font-normal normal-case text-ink-400">(optional)</span>
            </label>
            <input id="ef-email" name="email" type="email" autoComplete="email"
              placeholder="you@example.com" className={field} />
          </div>
          <div>
            <label htmlFor="ef-audience" className={labelCls}>
              I am a…
            </label>
            <select id="ef-audience" name="audienceType" defaultValue="graduate" className={field}>
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showProgramPicker && (
          <div>
            <label htmlFor="ef-program" className={labelCls}>
              Program of interest{" "}
              <span className="font-normal normal-case text-ink-400">(optional)</span>
            </label>
            <select id="ef-program" name="programInterest" defaultValue="general" className={field}>
              <option value="general">Not sure yet — help me choose</option>
              {programs!.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {!hideMessage && (
          <div>
            <label htmlFor="ef-message" className={labelCls}>
              Message <span className="font-normal normal-case text-ink-400">(optional)</span>
            </label>
            <textarea id="ef-message" name="message" rows={3}
              placeholder="Your goals, preferred batch timing, or any question…" className={field} />
          </div>
        )}

        {status === "error" && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-accent-500 bg-accent-500 px-6 py-3.5 text-[0.9rem] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-600 hover:bg-accent-600 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Request free callback"}
        </button>
        <p className="text-center text-xs text-ink-400">
          By submitting you agree to be contacted about DAIT programs. No spam.
        </p>
      </form>
    </div>
  );
}
