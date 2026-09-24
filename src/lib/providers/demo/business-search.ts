import { AppError, DEMO_NOTICE } from "@/lib/config";
import { EMPTY_FILTERS } from "@/lib/constants";
import type {
  Business,
  DataProvenance,
  FilterFacets,
  SearchQuery,
  SearchResponse,
  SearchSummary,
  SortKey,
  WebsiteStatus,
} from "@/lib/types";
import type { BusinessSearchProvider, ProviderMeta } from "@/lib/providers/types";
import { findBlueprint, genericBlueprint, type CategoryBlueprint } from "@/lib/providers/demo/categories";
import { findCity, fallbackCity, type CityProfile } from "@/lib/providers/demo/cities";
import { getCachedDataset, findBusinessById, findCachedCity } from "@/lib/providers/demo/dataset";
import { parseDemoId } from "@/lib/providers/demo/ids";
import { buildDemoWebsiteAnalysis } from "@/lib/providers/demo/websites";
import { titleCase } from "@/lib/utils";

/**
 * Demo business-search provider.
 *
 * Stands in for a real data vendor. It answers exactly the same contract
 * (`BusinessSearchProvider`) so switching to Google Places / Yelp / an internal
 * API is a config change, not a refactor.
 */

const META: ProviderMeta = {
  id: "demo",
  label: "Axlori demo dataset",
  kind: "demo",
  productionReady: false,
};

export const demoProvenance: DataProvenance = {
  provider: "demo",
  providerLabel: "Axlori demo dataset",
  kind: "demo",
  verifiedListing: false,
  retrievedAt: new Date().toISOString(),
  notes: DEMO_NOTICE,
};

export function resolveCategory(term: string): CategoryBlueprint {
  const clean = term.trim().replace(/\s+/g, " ");
  if (clean.length < 2) {
    throw new AppError(
      "invalid_query",
      "Enter a business type to search for.",
      "Try something like “Barber shop”, “Restaurant” or “Dental clinic”.",
    );
  }
  return findBlueprint(clean) ?? genericBlueprint(titleCase(clean));
}

export function resolveCity(location: string): CityProfile {
  const clean = location.trim();
  if (clean.length < 2) {
    throw new AppError(
      "invalid_location",
      "Enter a location to search in.",
      "Try a city and state or country, for example “Columbus, Ohio”.",
    );
  }
  return findCity(clean) ?? fallbackCity(clean);
}

/** Businesses with a website in a set — used for the extrapolation above. */
function summaryBaseHasWebsite(businesses: Business[]) {
  return businesses.filter((b) => b.websiteStatus === "has_website").length;
}

function applyFilters(businesses: Business[], query: SearchQuery): Business[] {
  const filters = query.filters ?? EMPTY_FILTERS;
  return businesses.filter((b) => {
    if (filters.websiteStatus.length && !filters.websiteStatus.includes(b.websiteStatus)) return false;
    if (filters.contact.includes("phone") && !b.phone) return false;
    if (filters.contact.includes("email") && !b.email) return false;
    if (filters.contact.includes("whatsapp") && !b.whatsappAvailable) return false;
    if (filters.minRating !== null && (b.rating ?? 0) < filters.minRating) return false;
    if (filters.maxDistanceMiles !== null && (b.distanceMiles ?? 0) > filters.maxDistanceMiles) return false;
    if (filters.categories.length && !filters.categories.includes(b.category)) return false;
    return true;
  });
}

function relevanceScore(b: Business) {
  const rating = b.rating ?? 0;
  const reviews = b.reviewCount ?? 0;
  const reviewWeight = Math.log10(reviews + 10) * 6;
  const distancePenalty = (b.distanceMiles ?? 0) * 0.35;
  return rating * 12 + reviewWeight - distancePenalty;
}

function opportunityScore(b: Business) {
  let score = 0;
  if (b.websiteStatus === "no_website") score += 60;
  if (b.websiteStatus === "has_website") score += 6;
  if ((b.rating ?? 0) >= 4.5) score += 12;
  if ((b.reviewCount ?? 0) >= 50) score += 8;
  if (!b.email) score += 6;
  if (!b.phone) score += 6;
  if (b.websiteStatus === "has_website") {
    const analysis = buildDemoWebsiteAnalysis(b);
    if (analysis.status === "needs_improvement") score += 26;
    if (analysis.status === "good") score -= 10;
  }
  return score;
}

function sortBusinesses(businesses: Business[], sort: SortKey): Business[] {
  const rows = [...businesses];
  switch (sort) {
    case "distance":
      return rows.sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999));
    case "rating":
      return rows.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case "newest":
      return rows.sort(
        (a, b) =>
          new Date(b.providerUpdatedAt ?? 0).getTime() - new Date(a.providerUpdatedAt ?? 0).getTime(),
      );
    case "website_opportunity":
      return rows.sort((a, b) => opportunityScore(b) - opportunityScore(a));
    case "relevance":
    default:
      return rows.sort((a, b) => relevanceScore(b) - relevanceScore(a));
  }
}

export function buildFacets(businesses: Business[]): FilterFacets {
  const websiteStatus: Record<WebsiteStatus, number> = {
    has_website: 0,
    no_website: 0,
    unknown_website_status: 0,
  };
  const contact = { phone: 0, email: 0, whatsapp: 0 };
  const categoryCounts = new Map<string, number>();

  for (const b of businesses) {
    websiteStatus[b.websiteStatus] += 1;
    if (b.phone) contact.phone += 1;
    if (b.email) contact.email += 1;
    if (b.whatsappAvailable) contact.whatsapp += 1;
    categoryCounts.set(b.category, (categoryCounts.get(b.category) ?? 0) + 1);
  }

  return {
    websiteStatus,
    contact,
    categories: [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Summary counts for a result set. `needsImprovement` and `analysedWebsites` come
 * from whatever website checks have actually been run — never from a guess.
 */
export function buildSummary(
  businesses: Business[],
  analysis: { analysedWebsites: number; needsImprovement: number } = { analysedWebsites: 0, needsImprovement: 0 },
): SearchSummary {
  let hasWebsite = 0;
  let noWebsite = 0;
  let unknownWebsite = 0;
  let emailAvailable = 0;
  let phoneAvailable = 0;
  let whatsappAvailable = 0;

  for (const b of businesses) {
    if (b.websiteStatus === "has_website") hasWebsite += 1;
    else if (b.websiteStatus === "no_website") noWebsite += 1;
    else unknownWebsite += 1;

    if (b.email) emailAvailable += 1;
    if (b.phone) phoneAvailable += 1;
    if (b.whatsappAvailable) whatsappAvailable += 1;
  }

  return {
    total: businesses.length,
    hasWebsite,
    noWebsite,
    unknownWebsite,
    needsImprovement: analysis.needsImprovement,
    analysedWebsites: analysis.analysedWebsites,
    emailAvailable,
    phoneAvailable,
    whatsappAvailable,
  };
}

export const demoBusinessSearchProvider: BusinessSearchProvider = {
  meta: META,
  isConfigured: () => true,
  async search(query: SearchQuery) {
    const blueprint = resolveCategory(query.term);
    const city = resolveCity(query.location);
    const radius = Math.min(Math.max(query.radiusMiles, 1), 200);

    const all = getCachedDataset({ blueprint, city, radiusMiles: radius });
    const filtered = applyFilters(all, query);
    const sorted = sortBusinesses(filtered, query.sort);

    const page = Math.max(1, query.page);
    const pageSize = Math.min(Math.max(query.pageSize, 1), 200);
    const start = (page - 1) * pageSize;
    const pageRows = sorted.slice(start, start + pageSize);

    // Demo checklists are canned profiles, so attaching a preview to each row is
    // free here. Live providers omit `websiteCheckPreview` and the UI shows
    // "Not checked" instead of implying an analysis ran.
    let needsImprovement = 0;
    let analysedWebsites = 0;
    const businesses: Business[] = pageRows.map((business) => {
      if (business.websiteStatus !== "has_website") return business;
      const analysis = buildDemoWebsiteAnalysis(business);
      if (analysis.measurement.mode === "none") return business;
      analysedWebsites += 1;
      if (analysis.status === "needs_improvement") needsImprovement += 1;
      return {
        ...business,
        websiteCheckPreview: {
          status: analysis.status,
          note: analysis.observations[0] ?? "",
          mode: analysis.measurement.mode,
        },
      };
    });

    // Extrapolate the "needs improvement" share to the full result set so the
    // summary reflects the whole search, not just the visible page. The ratio comes
    // from rows that were genuinely reviewed, and `analysedWebsites` is reported so
    // the UI can disclose the sample size behind the estimate.
    const summaryBase = buildSummary(sorted, {
      analysedWebsites,
      needsImprovement:
        analysedWebsites > 0 && sorted.length > businesses.length
          ? Math.round((needsImprovement / analysedWebsites) * (summaryBaseHasWebsite(sorted)))
          : needsImprovement,
    });

    const facets = buildFacets(all);

    const response: SearchResponse = {
      query: { ...query, page, pageSize, radiusMiles: radius, filters: query.filters ?? EMPTY_FILTERS },
      businesses,
      total: sorted.length,
      unfilteredTotal: all.length,
      summary: summaryBase,
      categoryBreakdown: facets.categories,
      facets,
      provider: { ...demoProvenance, retrievedAt: new Date().toISOString() },
      isDemoData: true,
      hasMore: start + businesses.length < sorted.length,
      notices: [
        DEMO_NOTICE,
        `${all.length} sample listings matched “${blueprint.label}” within ${radius} miles of ${city.city}${
          city.region ? `, ${city.region}` : ""
        }.`,
      ],
    };
    return response;
  },

  /**
   * Resolve one business.
   *
   * The fast path is the in-process index filled by searches. If that misses
   * (cold start, different instance, shared link) the id is parsed and the exact
   * dataset is regenerated, so detail pages never depend on server memory.
   */
  async getById(id: string) {
    const cached = findBusinessById(id);
    if (cached) return cached;

    const parsed = parseDemoId(id);
    if (!parsed) return null;

    const city = findCachedCity(parsed.city.key) ?? parsed.city;
    const dataset = getCachedDataset({
      blueprint: parsed.blueprint,
      city,
      radiusMiles: parsed.radiusMiles,
    });

    return dataset.find((business) => business.id === id) ?? dataset[parsed.index] ?? null;
  },

  async getCategoryBreakdown(location: string) {
    const city = resolveCity(location);
    const popular = ["restaurant", "barber", "hair_salon", "cafe", "gym", "dental"];
    const counts = popular
      .map((id) => findBlueprint(id.replace(/_/g, " ")))
      .filter((bp): bp is CategoryBlueprint => Boolean(bp))
      .map((blueprint) => ({
        category: blueprint.label,
        count: getCachedDataset({ blueprint, city, radiusMiles: 25 }).length,
      }))
      .sort((a, b) => b.count - a.count);
    return counts;
  },
};
