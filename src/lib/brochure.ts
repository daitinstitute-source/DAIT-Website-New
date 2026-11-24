/**
 * Signed, short-lived tokens for the brochure download.
 *
 * The PDFs used to sit in public/downloads/ with their paths written into the
 * page source, so the "details form" in front of them was decoration — anyone
 * could read the URL and take the file. They now live outside the web root in
 * assets/brochures/ and are only reachable through /api/brochure, which
 * demands one of these tokens.
 *
 * A token is minted by /api/leads ONLY after a lead has actually been filed,
 * which is what makes the gate real: no form, no token, no file.
 *
 * Web Crypto rather than node:crypto, so the same code runs on Vercel and on
 * Cloudflare Workers — the repo's rule that the host stays swappable.
 *
 * This keeps an honest person honest. Someone who fills the form and then
 * passes the file around is not stopped by anything we can do server-side, and
 * should not be: it is a brochure, not a credential.
 */

export type BrochureLang = "en" | "mr";

/** Fifteen minutes: long enough to download, short enough to be worthless if shared. */
const TTL_MS = 15 * 60 * 1000;

const enc = new TextEncoder();

const b64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const unb64url = (s: string): Uint8Array => {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * The signing secret.
 *
 * BROCHURE_SECRET is the right thing to set. Falling back to BREVO_API_KEY
 * means the gate works the moment this deploys instead of breaking every
 * download until someone adds a variable — the key is only ever used to sign
 * locally and never leaves the server. Returns "" when neither exists, and the
 * caller must treat that as "refuse", never as "allow".
 */
export const brochureSecret = (env: Record<string, string | undefined>): string =>
  env.BROCHURE_SECRET || env.BREVO_API_KEY || "";

/** `<payload>.<signature>`, both base64url. */
export async function mintBrochureToken(
  lang: BrochureLang,
  secret: string,
): Promise<string> {
  if (!secret) return "";
  const payload = b64url(enc.encode(JSON.stringify({ l: lang, e: Date.now() + TTL_MS })));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(payload));
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

export interface TokenCheck {
  ok: boolean;
  lang?: BrochureLang;
  reason?: "missing" | "malformed" | "bad-signature" | "expired";
}

/** Verify signature first, then expiry — never trust the payload before the signature. */
export async function verifyBrochureToken(
  token: string,
  secret: string,
): Promise<TokenCheck> {
  if (!secret || !token) return { ok: false, reason: "missing" };

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return { ok: false, reason: "malformed" };

  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await key(secret),
      unb64url(sig),
      enc.encode(payload),
    );
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!valid) return { ok: false, reason: "bad-signature" };

  try {
    const { l, e } = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (typeof e !== "number" || Date.now() > e) return { ok: false, reason: "expired" };
    return { ok: true, lang: l === "mr" ? "mr" : "en" };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

/** The file on disk for each language. Outside public/ on purpose. */
export const BROCHURE_FILES: Record<BrochureLang, string> = {
  en: "assets/brochures/dait-institute-brochure.pdf",
  mr: "assets/brochures/dait-institute-brochure-marathi.pdf",
};

/** What the browser should call the downloaded file. */
export const BROCHURE_FILENAMES: Record<BrochureLang, string> = {
  en: "DAIT-Institute-Brochure.pdf",
  mr: "DAIT-Institute-Brochure-Marathi.pdf",
};
