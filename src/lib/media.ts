/**
 * media.ts — image helpers (build-time).
 *
 * Hero backdrops are handled by HeroBackdrop.astro via astro:assets
 * (`src/assets/hero/<name>.jpg`, optimised at build). This file keeps the
 * public-path existence helper used by the blog and image-feature sections.
 */
import { existsSync } from "node:fs";

/**
 * Returns a public image path only if the file actually exists in /public — so a
 * frontmatter `image:` can be set ahead of time and gracefully falls back (to a
 * gradient banner) until the real file is dropped in. Accepts "/images/..." paths.
 */
export function existingImage(publicPath?: string): string | undefined {
  if (!publicPath) return undefined;
  const onDisk = `public${publicPath.startsWith("/") ? "" : "/"}${publicPath}`;
  return existsSync(onDisk) ? publicPath : undefined;
}
