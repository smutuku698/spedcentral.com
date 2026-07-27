// Shared BreadcrumbList JSON-LD builder -- every page's visible breadcrumb
// nav should produce one of these, since it's what lets Google show the
// breadcrumb trail directly in search results instead of a bare URL.
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[], site: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: new URL(item.url, site).toString(),
    })),
  };
}

// Sitewide -- rendered on every page via Layout.astro. This is what makes
// the site itself (not just individual pages) eligible for a Google
// sitelinks search box, and gives the brand its own Organization entity
// instead of every page just being an unconnected URL.
export function websiteJsonLd(site: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SpedCentral",
    url: site.toString(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.toString().replace(/\/$/, "")}/search/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd(site: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SpedCentral",
    url: site.toString(),
  };
}

// Category hub pages list providers/products -- an ItemList tells Google
// this page's core content IS a list of things, which is what makes it
// eligible for list-style rich results rather than being read as a single
// generic article.
export function itemListJsonLd(items: { name: string; url: string }[], site: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: new URL(item.url, site).toString(),
      name: item.name,
    })),
  };
}

// schema.org has purpose-built LocalBusiness subtypes with their own rich-
// result eligibility (MedicalBusiness, EducationalOrganization, ChildCare,
// LegalService...) -- using generic "LocalBusiness" everywhere, or worse,
// "Person" for a solo practitioner, forfeits that. Mapped by the provider's
// top-level category GROUP since that's the meaningful business type, not
// the specific specialty.
const SCHEMA_TYPE_BY_GROUP: Record<string, string> = {
  "medical-clinical-therapists": "MedicalBusiness",
  "academic-school-based-specialists": "EducationalOrganization",
  "legal-advocacy-family-support": "LegalService",
  "early-intervention-childcare": "ChildCare",
  "adult-transition-services": "ProfessionalService",
  "recreation-community": "SportsActivityLocation",
  "facilities-programs": "MedicalBusiness",
};

export function schemaTypeForGroup(groupSlug: string | null | undefined): string {
  return (groupSlug && SCHEMA_TYPE_BY_GROUP[groupSlug]) || "LocalBusiness";
}

export interface ProviderHours {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

const SCHEMA_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function openingHoursSpecification(hours: ProviderHours[]) {
  return hours
    .filter((h) => !h.is_closed)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAY_NAMES[h.day_of_week]}`,
      opens: h.opens_at,
      closes: h.closes_at,
    }));
}
