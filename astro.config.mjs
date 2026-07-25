// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Static output. Per-route SSR opt-in later via `export const prerender = false`
  // (add the Cloudflare adapter in Phase 2 when /api/leads is built).
  output: "static",
  site: process.env.PUBLIC_SITE_URL || "https://daitinstitute.com",
  integrations: [react(), mdx(), sitemap(), icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
