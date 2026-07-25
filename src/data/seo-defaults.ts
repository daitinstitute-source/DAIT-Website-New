/**
 * seo-defaults.ts — default meta + the site-wide EducationalOrganization
 * JSON-LD. BaseLayout merges page-level SEOProps over these defaults.
 */
import type { EducationalOrganization, LocalBusiness, WithContext } from "schema-dts";
import { siteConfig } from "../config/site";

export const seoDefaults = {
  titlePattern: (title: string) => `${title} | DAIT Institute`,
  defaultTitle: `DAIT Institute — ${siteConfig.tagline}`,
  defaultDescription: siteConfig.description,
  defaultOgImage: siteConfig.logo.ogImage,
  locale: "en_IN",
  twitterCard: "summary_large_image" as const,
};

/** Site-wide organization schema, injected on every page via BaseLayout. */
export function educationalOrganizationSchema(): WithContext<EducationalOrganization> {
  const center = siteConfig.centers[0];
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.logo.horizontalLight}`,
    image: `${siteConfig.url}${siteConfig.logo.ogImage}`,
    description: siteConfig.description,
    slogan: siteConfig.tagline,
    email: siteConfig.email,
    ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: center.city,
      addressRegion: center.state,
      addressCountry: "IN",
      ...(center.postalCode ? { postalCode: center.postalCode } : {}),
    },
    sameAs: siteConfig.social
      .map((s) => s.href)
      .filter((h) => h && h !== "#"),
  };
}

/**
 * LocalBusiness schema — powers Google's local pack / Maps and hyperlocal search
 * ("IT institute near me", "… in Sambhaji Nagar"). Linked to the org node.
 * geo + hasMap emit only once the real centre coords / Maps link are set in site.ts.
 */
export function localBusinessSchema(): WithContext<LocalBusiness> {
  const center = siteConfig.centers[0];
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    image: `${siteConfig.url}${siteConfig.logo.ogImage}`,
    url: siteConfig.url,
    ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
    email: siteConfig.email,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: center.addressLines.join(", "),
      addressLocality: center.city,
      addressRegion: center.state,
      addressCountry: "IN",
      ...(center.postalCode ? { postalCode: center.postalCode } : {}),
    },
    areaServed: { "@type": "City", name: center.city },
    ...(center.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: center.geo.lat, longitude: center.geo.lng } }
      : {}),
    ...(center.mapUrl ? { hasMap: center.mapUrl } : {}),
    ...(center.openingHours ? { openingHours: center.openingHours } : {}),
    sameAs: siteConfig.social.map((s) => s.href).filter((h) => h && h !== "#"),
    parentOrganization: { "@id": `${siteConfig.url}/#organization` },
  };
}
