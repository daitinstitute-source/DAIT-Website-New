/**
 * seo.ts — canonical URL + JSON-LD helpers.
 */
import type { Thing, WithContext } from "schema-dts";
import { siteConfig } from "../config/site";

/** Absolute canonical URL from a path or an Astro URL. */
export function canonicalUrl(pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  // Normalise trailing slash except root.
  const withSlash =
    clean === "/" || clean.includes(".") || clean.endsWith("/")
      ? clean
      : `${clean}/`;
  return `${siteConfig.url}${withSlash}`;
}

/**
 * The path for a program detail page.
 *
 * Programs live at the ROOT (`/software-development-course-sambhaji-nagar/`),
 * not under `/programs/`. The hub page keeps `/programs/`, and the route that
 * renders a program is `src/pages/[slug].astro`.
 *
 * Every link to a program must go through here. The pattern moved once
 * already and the cost was tracking down ten hardcoded copies of it; the next
 * change should be this one line.
 *
 * Note each slug ends in `-course-sambhaji-nagar`, so a root-level dynamic
 * route cannot realistically collide with a future static page — and static
 * routes win over dynamic ones in Astro regardless.
 */
export function programUrl(slug: string): string {
  return `/${slug}/`;
}

/** Absolute URL for an asset path (og images etc.). */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serialize a schema-dts object to a JSON-LD string safe for a <script>. */
export function jsonLd<T extends Thing>(schema: WithContext<T>): string {
  // Escape "<" to avoid breaking out of the script tag.
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
