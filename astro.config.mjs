// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";

/**
 * Dev-only bridge for the lead pipeline.
 *
 * `/api/leads` is a serverless function, and `astro dev` serves none, so the forms
 * used to 404 locally and no lead could be tested without deploying. This plugin runs
 * the SAME pipeline the deployed function runs (src/lib/leads.ts) inside the dev
 * server, with credentials read from `.dev.vars`, so submitting a form on
 * localhost:4321 files a real contact + deal in Brevo.
 *
 * Calling the shared module rather than one host's adapter is deliberate: dev then
 * behaves identically whether the site deploys to Vercel or Cloudflare.
 *
 * `apply: "serve"` — dev only, production is untouched.
 */
/** @returns {import("vite").Plugin} */
function devLeadsApi() {
  return {
    name: "dait:dev-leads-api",
    apply: "serve",
    /** @param {import("vite").ViteDevServer} server */
    configureServer(server) {
      server.middlewares.use(
        /**
         * \@param {import("node:http").IncomingMessage} req
         * \@param {import("node:http").ServerResponse} res
         * \@param {(err?: unknown) => void} next
         */
        async (req, res, next) => {
        const path = (req.url || "").split("?")[0];
        if (path !== "/api/leads") return next();
        if (req.method !== "POST") return next();

        try {
          /** @type {Buffer[]} */
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks).toString("utf8");

          // The real pipeline + the same env vars the host would inject.
          const { handleLead } = await server.ssrLoadModule("/src/lib/leads.ts");
          const { loadEnv } = await server.ssrLoadModule("/scripts/_env.mjs");
          const env = loadEnv();

          if (!env.BREVO_API_KEY) {
            console.warn(
              "\n[leads] BREVO_API_KEY missing in .dev.vars — the lead will be logged, not sent to Brevo.\n",
            );
          }

          let lead;
          try {
            lead = JSON.parse(body);
          } catch {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
            return;
          }

          const { status, body: payload } = await handleLead(lead, env);
          const text = JSON.stringify(payload);
          console.log(`[leads] ${status} ${text}`);
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(text);
        } catch (err) {
          console.error("[leads] dev handler error:", err);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      });
    },
  };
}

/**
 * Dev-only bridge for the chatbot, for the same reason as devLeadsApi above:
 * `/api/chat` is a serverless function and `astro dev` serves none.
 *
 * Streams SSE straight through, so local chat behaves like production rather
 * than arriving in one lump — which is where response-buffering bugs hide.
 *
 * Note this spends real API credit on every local message, same as the lead
 * bridge files real Brevo contacts.
 */
/** @returns {import("vite").Plugin} */
function devChatApi() {
  return {
    name: "dait:dev-chat-api",
    apply: "serve",
    /** @param {import("vite").ViteDevServer} server */
    configureServer(server) {
      server.middlewares.use(
        /**
         * \@param {import("node:http").IncomingMessage} req
         * \@param {import("node:http").ServerResponse} res
         * \@param {(err?: unknown) => void} next
         */
        async (req, res, next) => {
          const path = (req.url || "").split("?")[0];
          if (path !== "/api/chat") return next();
          if (req.method !== "POST") return next();

          try {
            /** @type {Buffer[]} */
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);

            const { streamChat, validateChat } = await server.ssrLoadModule("/src/lib/chat.ts");
            const { loadEnv } = await server.ssrLoadModule("/scripts/_env.mjs");
            const env = loadEnv();

            if (!env.ANTHROPIC_API_KEY) {
              console.warn("\n[chat] ANTHROPIC_API_KEY missing in .dev.vars — chat will 503.\n");
            }

            let body;
            try {
              body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            } catch {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
              return;
            }

            const bad = validateChat(body, env, undefined, "dev");
            if (bad) {
              console.log(`[chat] ${bad.status} ${bad.message}`);
              res.statusCode = bad.status;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: false, error: bad.message }));
              return;
            }

            res.statusCode = 200;
            res.setHeader("content-type", "text/event-stream; charset=utf-8");
            res.setHeader("cache-control", "no-cache, no-transform");

            const reader = (await streamChat(body, env)).getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) res.write(value);
            }
            res.end();
          } catch (err) {
            console.error("[chat] dev handler error:", err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(err) }));
            } else {
              res.end();
            }
          }
        },
      );
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Static output. Per-route SSR opt-in later via `export const prerender = false`
  // (add the Cloudflare adapter in Phase 2 when /api/leads is built).
  output: "static",
  site: process.env.PUBLIC_SITE_URL || "https://daitinstitute.com",
  /**
   * Keep every noindex page out of the sitemap. Submitting a URL you also tell
   * Google not to index earns a "Submitted URL marked noindex" error in Search
   * Console — not a ranking penalty, but it buries real problems in noise.
   *
   * Anything added here must match a page that sets `noindex` in its BaseLayout
   * props, and vice versa; the two are a pair.
   *   /brochure/   — shared by WhatsApp link, not a landing page
   *   /thank-you/  — post-submit only (the LIVE robots.txt disallows it too)
   *   /verify/     — certificate lookup, reached with a code
   */
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) =>
        !["/brochure/", "/thank-you/", "/verify/"].some((p) => page.includes(p)),
    }),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss(), devLeadsApi(), devChatApi()],
  },
});
