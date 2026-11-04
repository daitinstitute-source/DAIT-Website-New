/**
 * ChatWidget — the site-wide counselling chatbot. React island.
 *
 * Sits above the WhatsApp button (which is fixed bottom-5 right-5, h-14), so
 * this one is bottom-24 and the two never collide.
 *
 * Talks to /api/chat, which streams SSE. We read the stream by hand rather than
 * using EventSource, because EventSource is GET-only and the conversation has
 * to be POSTed.
 *
 * The transcript lives in sessionStorage so a page navigation doesn't throw the
 * conversation away — on a marketing site people click through to a program
 * page mid-chat, and losing their thread there is the fastest way to lose them.
 * It is per-tab and never leaves the browser except as the messages we POST.
 *
 * NO fee, placement promise or portal link can come out of here; those rules
 * live server-side in src/lib/chat.ts, not in this component.
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  /** Shown before the visitor types anything. */
  greeting?: string;
  /** Suggested openers. Keep them short — they render as chips. */
  prompts?: string[];
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const STORE = "dait_chat";
const MAX_CHARS = 1500; // mirrors LIMITS.messageChars server-side

/**
 * First-party engagement snapshot, same shape EnquiryForm sends so a chat lead
 * and a form lead carry identical fields in Brevo. Returns nothing when the
 * visitor declined cookies — the tracker never ran, so there is nothing to read.
 */
function readEngagement(): Record<string, string | number> {
  if (typeof window === "undefined") return {};
  let s: Record<string, unknown> = {};
  try {
    s = JSON.parse(sessionStorage.getItem("dait_sess") ?? "{}") ?? {};
  } catch {
    return {};
  }
  if (!s.start) return {};
  const visit = Number(s.visit) || 1;
  return {
    leadSource: (s.source as string) || "Direct",
    landingPage: (s.landing as string) || window.location.pathname,
    pagesViewed: Number(s.pages) || 1,
    timeOnSiteSec: Math.max(0, Math.round((Date.now() - Number(s.start)) / 1000)),
    visitor: visit > 1 ? "returning" : "new",
    visitNumber: visit,
    referrer: (s.referrer as string) || "",
  };
}

export default function ChatWidget({
  greeting = "Hi — I can help you work out which program fits you, or answer anything about DAIT. What are you looking to do?",
  prompts = [
    "Which course suits a fresher?",
    "I want to switch careers",
    "Do you have weekend batches?",
  ],
}: Props) {
  const [open, setOpen] = useState(false);
  const [consentPending, setConsentPending] = useState(true);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [leadFiled, setLeadFiled] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Stay out of the way until the cookie banner is answered.
   *
   * CookieConsent is fixed to the bottom at z-[60], above this widget's z-50,
   * and on a phone it covers the composer completely — a first-time visitor
   * could open the chat and not be able to type. Raising our z-index would fix
   * the overlap by burying a consent choice the visitor is legally owed, which
   * is the wrong trade. The banner is a one-time, momentary decision, so the
   * chat simply waits for it.
   */
  useEffect(() => {
    const banner = document.getElementById("cookie-consent");
    if (!banner) {
      setConsentPending(false);
      return;
    }
    const sync = () => setConsentPending(!banner.hidden);
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(banner, { attributes: true, attributeFilter: ["hidden"] });
    return () => mo.disconnect();
  }, []);

  // Restore an in-progress conversation after a page navigation.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE);
      if (saved) {
        const parsed = JSON.parse(saved) as { turns?: Turn[]; open?: boolean };
        if (Array.isArray(parsed.turns) && parsed.turns.length) {
          setTurns(parsed.turns);
          setOpen(Boolean(parsed.open));
        }
      }
    } catch {
      /* private mode or cleared storage — start fresh, never crash */
    }
  }, []);

  useEffect(() => {
    if (!turns.length) return;
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ turns, open }));
    } catch {
      /* ignore */
    }
  }, [turns, open]);

  // Keep the newest message in view as it streams in.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes; abort any in-flight stream when unmounting.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || busy) return;

      setError("");
      setDraft("");
      const next: Turn[] = [...turns, { role: "user", content: body }];
      setTurns(next);
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            messages: next,
            page: window.location.pathname,
            session: readEngagement(),
          }),
        });

        if (!res.ok || !res.body) {
          const msg = await res
            .json()
            .then((j: { error?: string }) => j.error)
            .catch(() => null);
          setError(msg || "Chat is unavailable right now. Please use the contact page.");
          setBusy(false);
          return;
        }

        // Open an empty assistant turn and fill it as deltas arrive.
        setTurns((t) => [...t, { role: "assistant", content: "" }]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line; keep any partial tail.
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const evLine = frame.match(/^event: (.+)$/m);
            const dataLine = frame.match(/^data: (.+)$/m);
            if (!evLine || !dataLine) continue;

            let payload: Record<string, unknown>;
            try {
              payload = JSON.parse(dataLine[1]);
            } catch {
              continue;
            }

            if (evLine[1] === "text") {
              const delta = String(payload.t ?? "");
              setTurns((t) => {
                const copy = [...t];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  copy[copy.length - 1] = { ...last, content: last.content + delta };
                }
                return copy;
              });
            } else if (evLine[1] === "lead") {
              if (payload.ok) setLeadFiled(true);
            } else if (evLine[1] === "error") {
              setError(String(payload.message ?? "Something went wrong."));
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError("Connection lost. Please try again.");
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
        // Drop a trailing empty bubble if the stream died before any text.
        setTurns((t) =>
          t.length && t[t.length - 1].role === "assistant" && !t[t.length - 1].content
            ? t.slice(0, -1)
            : t,
        );
      }
    },
    [busy, turns],
  );

  const reset = () => {
    abortRef.current?.abort();
    setTurns([]);
    setError("");
    setLeadFiled(false);
    try {
      sessionStorage.removeItem(STORE);
    } catch {
      /* ignore */
    }
  };

  if (consentPending) return null;

  return (
    <>
      {/* Launcher. Blue, not orange — the orange CTA is the counselling button,
          and two competing accents on one screen help nobody. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="dait-chat-panel"
        aria-label={open ? "Close the chat" : "Ask DAIT a question"}
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 motion-reduce:transition-none"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          id="dait-chat-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Chat with DAIT Institute"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[min(80vh,640px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface-75 shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-accent-500 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-sm font-black leading-tight">DAIT Institute</p>
              <p className="text-[0.7rem] text-white/75">
                Course &amp; career questions · replies in seconds
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md px-2 py-1 text-[0.7rem] font-semibold text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  New chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the chat"
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Transcript */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-atomic="false"
            className="flex-1 space-y-3 overflow-y-auto bg-surface-50 px-4 py-4"
          >
            <Bubble role="assistant">{greeting}</Bubble>

            {turns.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {prompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-border-blue bg-surface-75 px-3 py-1.5 text-xs font-semibold text-accent-500 transition-colors hover:bg-accent-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {turns.map((t, i) => (
              <Bubble key={i} role={t.role}>
                {t.content}
              </Bubble>
            ))}

            {busy && turns[turns.length - 1]?.role === "user" && (
              <div className="flex gap-1 px-1" aria-label="Typing">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            )}

            {leadFiled && (
              <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600">
                Callback request sent — a counsellor will call you.
              </p>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-600">
                {error}
              </p>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="border-t border-border bg-surface-75 px-3 py-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter makes a new line — chat convention.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                placeholder="Ask about courses, batches, careers…"
                aria-label="Your message"
                disabled={busy}
                className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-border bg-surface-50 px-3 py-2 text-sm text-ink-600 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-[0.65rem] leading-snug text-ink-400">
              An AI assistant — it can make mistakes, and fees and batch dates are
              confirmed by a counsellor. Your chat may be shared with our team.
            </p>
          </form>
        </div>
      )}
    </>
  );
}

/**
 * One message. Assistant replies come back as plain text with /programs/… and
 * /blog/… paths in them; we linkify those and nothing else, so there is no
 * markdown renderer and no HTML from the model reaching the DOM.
 */
function Bubble({ role, children }: { role: "user" | "assistant"; children: string }) {
  const mine = role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          mine
            ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent-500 px-3.5 py-2.5 text-sm leading-relaxed text-white"
            : "max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-border bg-surface-75 px-3.5 py-2.5 text-sm leading-relaxed text-ink-600"
        }
      >
        {mine ? children : linkify(children)}
      </div>
    </div>
  );
}

/** Turns bare /programs/… and /blog/… paths into real links. Text only. */
function linkify(text: string) {
  const parts = text.split(/(\/(?:programs|blog)\/[a-z0-9-]+\/?)/g);
  return parts.map((part, i) =>
    /^\/(?:programs|blog)\/[a-z0-9-]+\/?$/.test(part) ? (
      <a
        key={i}
        href={part.endsWith("/") ? part : `${part}/`}
        className="font-semibold text-accent-500 underline underline-offset-2 hover:text-accent-600"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}
