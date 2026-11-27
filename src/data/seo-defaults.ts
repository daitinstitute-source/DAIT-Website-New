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
    /**
     * Topical entity signals — what this organisation is actually about.
     * Helps Google connect the brand to these subjects rather than inferring
     * them page by page. Keep it to subjects genuinely taught here; padding it
     * with terms the curriculum does not cover devalues the whole node.
     */
    knowsAbout: [
      "Digital Marketing",
      "Search Engine Optimization",
      "Answer Engine Optimization",
      "Generative Engine Optimization",
      "Google Ads",
      "Performance Marketing",
      "Social Media Marketing",
      "Data Analytics",
      "Artificial Intelligence",
      "Machine Learning",
      "Computer Vision",
      "Software Development",
      "Cloud Computing",
      "DevOps",
      "Cybersecurity",
    ],
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
/**
 * Where DAIT serves — ONE definition, used by every schema that declares it.
 *
 * The city carries its former name as an alternateName, so the entity resolves
 * for "Aurangabad" searches without that word appearing in visible copy. The
 * localities follow as Place nodes contained in the city.
 *
 * Consulting used to declare areaServed: Country India while the courses
 * declared the city. Two schemas on one domain disagreeing about where the
 * business operates is exactly the kind of conflicting signal that weakens a
 * local listing, and the owner has since confirmed the intent is this city and
 * nearby only. Changing the radius now means changing serviceAreas in
 * config/site.ts, and everything follows.
 */
export function localAreaServed() {
  const center = siteConfig.centers[0];
  return [
    {
      "@type": "City" as const,
      name: center.city,
      ...(center.alternateCityName ? { alternateName: center.alternateCityName } : {}),
    },
    ...(center.serviceAreas ?? []).map((area) => ({
      "@type": "Place" as const,
      name: area,
      containedInPlace: { "@type": "City" as const, name: center.city },
    })),
  ];
}

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
    /**
     * The city node carries the old name as an alternateName, so the entity
     * resolves for "Aurangabad" searches without that word appearing on the
     * page. The localities follow as their own Place nodes — this is the
     * hyperlocal signal, and it is only credible while every entry is somewhere
     * a student would actually travel from.
     */
    areaServed: localAreaServed(),
    ...(center.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: center.geo.lat, longitude: center.geo.lng } }
      : {}),
    ...(center.mapUrl ? { hasMap: center.mapUrl } : {}),
    ...(center.openingHours ? { openingHours: center.openingHours } : {}),
    sameAs: siteConfig.social.map((s) => s.href).filter((h) => h && h !== "#"),
    parentOrganization: { "@id": `${siteConfig.url}/#organization` },
  };
}
