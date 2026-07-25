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
