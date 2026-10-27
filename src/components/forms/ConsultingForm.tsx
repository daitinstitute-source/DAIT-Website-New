/**
 * ConsultingForm — enquiry forms for /business-consulting/.
 *
 * Posts the SAME standard lead payload to /api/leads as every other form on the
 * site, so enquiries reach the existing Brevo pipeline with no backend change
 * and no new environment variables. Only the visible fields differ.
 *
 * ⚠️ `company` is the HONEYPOT in src/lib/leads.ts — the API pretends success
 * and silently discards any lead where it is filled. The real company name is
 * therefore sent as `extra.companyName`. Do not rename it to `company`.
 *
 * Consulting-specific answers ride in `extra`, which leads.ts writes into the
 * Brevo deal notes (and into a contact attribute when an UPPERCASED one of the
 * same name exists), so nothing is dropped.
 *
 * Mirrors EnquiryForm's hydration guard: the submit button stays disabled until
 * React has mounted, so a click can never fall through to a native submit that
 * reloads the page and loses the enquiry.
 */
import { useEffect, useState, type FormEvent } from "react";

type Variant = "consultation" | "partner";
type Status = "idle" | "submitting" | "error";

interface Props {
  variant?: Variant;
  formId?: string;
}

const INDUSTRIES = [
  "Manufacturing / industrial",
  "Cement & building materials",
  "Wires, cables & electricals",
  "IT services & enterprise software",
  "SaaS & cloud",
  "Healthcare & life sciences",
  "Other",
];

const PARTNER_CATEGORIES = [
  "ERP & CRM",
  "AI & automation",
  "Industrial software",
  "Cloud & data analytics",
  "IT & software services",
  "SEO & performance marketing",
  "Other",
];

const field =
  "w-full rounded-lg border border-border bg-surface-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-2 focus:outline-offset-1 focus:outline-accent-500";
const label = "block text-xs font-bold uppercase tracking-wider text-ink-500";

export default function ConsultingForm({
  variant = "consultation",
  formId,
}: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const isPartner = variant === "partner";
  const id = formId ?? (isPartner ? "Partner enquiry" : "Business consultation");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const companyName = String(fd.get("companyName") ?? "").trim();

    if (!name || !email || !companyName) {
      setError("Please fill in your name, business email and company.");
      setStatus("error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("That email address does not look right.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError("");

    // Engagement context written by BaseLayout's first-party tracker.
    let eng: Record<string, unknown> = {};
    try {
      const s = JSON.parse(sessionStorage.getItem("dait_sess") ?? "{}") ?? {};
      eng = {
        leadSource: s.source,
        landingPage: s.landing,
        pagesViewed: s.pages,
        visitNumber: s.visit,
        referrer: s.referrer,
      };
    } catch {
      /* storage blocked or consent refused — attribution is optional */
    }

    const payload = {
      name,
      email,
      phone: String(fd.get("phone") ?? "").trim(),
      programInterest: "business-consulting",
      audienceType: "other",
      message: String(fd.get("challenge") ?? fd.get("description") ?? "").trim(),
      // Honeypot. Must stay empty — see the file header.
      company: String(fd.get("company") ?? ""),
      source: typeof location !== "undefined" ? location.pathname : "",
      submittedAt: new Date().toISOString(),
      ...eng,
      extra: {
        form: id,
        enquiryType: isPartner ? "Technology partner" : "Business consultation",
        companyName,
        ...(isPartner
          ? {
              partnerCategory: String(fd.get("partnerCategory") ?? ""),
              website: String(fd.get("website") ?? "").trim(),
            }
          : {
              jobTitle: String(fd.get("jobTitle") ?? "").trim(),
              industry: String(fd.get("industry") ?? ""),
              consultationFormat: String(fd.get("format") ?? ""),
            }),
      },
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setDone(true);
    } catch {
      setStatus("error");
      setError(
        "Something went wrong sending that. Please email info@daitinstitute.com and we'll pick it up.",
      );
    }
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border-blue bg-accent-50 p-6"
      >
        <p className="text-lg font-bold text-ink-900">
          Thank you — that's with us.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {isPartner
            ? "We'll review your details and get in touch if there's a fit. Partner arrangements are always set out in writing before any referral is made."
            : "Amol will review your enquiry personally and reply to arrange a consultation. You'll usually hear back within one working day."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot — bots fill it, humans never see it. Keep the name "company". */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${variant}-name`}>
            Full name
          </label>
          <input
            id={`${variant}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            className={`mt-1.5 ${field}`}
          />
        </div>
        <div>
          <label className={label} htmlFor={`${variant}-email`}>
            Business email
          </label>
          <input
            id={`${variant}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className={`mt-1.5 ${field}`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${variant}-companyName`}>
            Company name
          </label>
          <input
            id={`${variant}-companyName`}
            name="companyName"
            type="text"
            required
            autoComplete="organization"
            placeholder="Your company"
            className={`mt-1.5 ${field}`}
          />
        </div>
        <div>
          <label className={label} htmlFor={`${variant}-phone`}>
            Phone <span className="font-medium normal-case text-ink-400">(optional)</span>
          </label>
          <input
            id={`${variant}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 …"
            className={`mt-1.5 ${field}`}
          />
        </div>
      </div>

      {isPartner ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="partner-category">
                Partner category
              </label>
              <select
                id="partner-category"
                name="partnerCategory"
                className={`mt-1.5 ${field}`}
                defaultValue={PARTNER_CATEGORIES[0]}
              >
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="partner-website">
                Website
              </label>
              <input
                id="partner-website"
                name="website"
                type="url"
                placeholder="https://"
                className={`mt-1.5 ${field}`}
              />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="partner-description">
              What you do
            </label>
            <textarea
              id="partner-description"
              name="description"
              rows={3}
              placeholder="A short description of your capability and the clients you serve."
              className={`mt-1.5 ${field}`}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="consult-jobTitle">
                Job title
              </label>
              <input
                id="consult-jobTitle"
                name="jobTitle"
                type="text"
                placeholder="e.g. Managing Director"
                className={`mt-1.5 ${field}`}
              />
            </div>
            <div>
              <label className={label} htmlFor="consult-industry">
                Industry
              </label>
              <select
                id="consult-industry"
                name="industry"
                className={`mt-1.5 ${field}`}
                defaultValue={INDUSTRIES[0]}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label} htmlFor="consult-challenge">
              Primary business challenge
            </label>
            <textarea
              id="consult-challenge"
              name="challenge"
              rows={3}
              placeholder="What you'd most like to fix — pipeline, positioning, sales process, team capability…"
              className={`mt-1.5 ${field}`}
            />
          </div>

          <fieldset>
            <legend className={label}>Preferred consultation format</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {["In person", "Online"].map((opt, i) => (
                <label
                  key={opt}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700"
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt}
                    defaultChecked={i === 0}
                    className="h-4 w-4 accent-[#1548a3]"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {status === "error" && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || status === "submitting"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-accent-500 bg-accent-500 px-6 py-3.5 text-[0.9rem] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-600 hover:bg-accent-600 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
      >
        {status === "submitting"
          ? "Sending…"
          : isPartner
            ? "Submit partner enquiry"
            : "Book a business consultation"}
      </button>

      <p className="text-xs leading-relaxed text-ink-400">
        By submitting this form you agree to be contacted about your enquiry. We
        do not sell your details or add you to unrelated mailing lists. See our{" "}
        <a
          href="/privacy-policy/"
          className="font-semibold text-accent-600 underline underline-offset-2"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
