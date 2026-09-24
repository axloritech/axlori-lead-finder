import { DEFAULT_RADIUS, EMPTY_FILTERS } from "@/lib/constants";
import type { ContactFilterKey, SearchFilters, SearchQuery, SortKey, WebsiteStatus } from "@/lib/types";

/**
 * Search state is URL-encoded so results are shareable, bookmarkable and survive a
 * refresh — and so the back button behaves the way users expect.
 */

const WS_VALUES: WebsiteStatus[] = ["has_website", "no_website", "unknown_website_status"];
const CONTACT_VALUES: ContactFilterKey[] = ["phone", "email", "whatsapp"];
const SORT_VALUES: SortKey[] = ["relevance", "distance", "rating", "newest", "website_opportunity"];

export interface RawParams {
  term?: string;
  location?: string;
  radius?: string;
  sort?: string;
  page?: string;
  ws?: string;
  ct?: string;
  rating?: string;
  distance?: string;
  cats?: string;
}

export function parseFilters(params: RawParams): SearchFilters {
  const split = (value?: string) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : []);

  return {
    websiteStatus: split(params.ws).filter((v): v is WebsiteStatus => WS_VALUES.includes(v as WebsiteStatus)),
    contact: split(params.ct).filter((v): v is ContactFilterKey => CONTACT_VALUES.includes(v as ContactFilterKey)),
    minRating: params.rating ? Number(params.rating) || null : null,
    maxDistanceMiles: params.distance ? Number(params.distance) || null : null,
    categories: split(params.cats),
  };
}

export function parseQuery(params: RawParams): Partial<SearchQuery> {
  const sort = SORT_VALUES.includes(params.sort as SortKey) ? (params.sort as SortKey) : "relevance";
  return {
    term: params.term ?? "",
    location: params.location ?? "",
    radiusMiles: params.radius ? Number(params.radius) || DEFAULT_RADIUS : DEFAULT_RADIUS,
    sort,
    page: params.page ? Number(params.page) || 1 : 1,
    filters: parseFilters(params),
  };
}

export function buildSearchParams(query: Partial<SearchQuery>): URLSearchParams {
  const search = new URLSearchParams();
  if (query.term) search.set("term", query.term);
  if (query.location) search.set("location", query.location);
  if (query.radiusMiles) search.set("radius", String(query.radiusMiles));
  if (query.sort && query.sort !== "relevance") search.set("sort", query.sort);
  if (query.page && query.page > 1) search.set("page", String(query.page));

  const filters = query.filters ?? EMPTY_FILTERS;
  if (filters.websiteStatus.length) search.set("ws", filters.websiteStatus.join(","));
  if (filters.contact.length) search.set("ct", filters.contact.join(","));
  if (filters.minRating) search.set("rating", String(filters.minRating));
  if (filters.maxDistanceMiles) search.set("distance", String(filters.maxDistanceMiles));
  if (filters.categories.length) search.set("cats", filters.categories.join(","));

  return search;
}

export function searchHref(query: Partial<SearchQuery>): string {
  return `/find?${buildSearchParams(query).toString()}`;
}

export function filtersActiveCount(filters: SearchFilters): number {
  return (
    filters.websiteStatus.length +
    filters.contact.length +
    (filters.minRating ? 1 : 0) +
    (filters.maxDistanceMiles ? 1 : 0) +
    filters.categories.length
  );
}
