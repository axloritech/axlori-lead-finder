import { AppError } from "@/lib/config";
import { EMPTY_FILTERS } from "@/lib/constants";
import { round } from "@/lib/utils";
import type {
  Business,
  SearchQuery,
  SearchResponse,
  SortKey,
  WebsiteStatus,
} from "@/lib/types";
import type { BusinessSearchProvider, ProviderMeta } from "@/lib/providers/types";
import { buildFacets, buildSummary } from "@/lib/providers/demo/business-search";

/**
 * Google Places (New) adapter — a **legitimate provider integration**.
 *
 * This is not a scraper. It calls the official Places API with an API key that
 * stays on the server (route handlers / server components only) and maps the
 * documented response onto our `Business` type. Fields Google does not publish —
 * email addresses, WhatsApp availability — are returned as `null` / `false` so the
 * UI can say “not available from this provider” instead of inventing values.
 *
 * Enable with:
 *   BUSINESS_DATA_PROVIDER=google_places
 *   BUSINESS_DATA_API_KEY=…
 */

const META: ProviderMeta = {
  id: "google_places",
  label: "Google Places API",
  kind: "live",
  productionReady: true,
};

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.regularOpeningHours",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.editorialSummary",
  "places.priceLevel",
  "places.businessStatus",
  "places.photos",
  "nextPageToken",
].join(",");

interface PlacesPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    periods?: { open: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } }[];
  };
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
  editorialSummary?: { text?: string };
  priceLevel?: string;
  businessStatus?: string;
  photos?: { name: string }[];
}

interface PlacesResponse {
  places?: PlacesPlace[];
  nextPageToken?: string;
  error?: { message?: string; status?: string };
}

function haversineMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 3958.8;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return round(2 * R * Math.asin(Math.sqrt(h)), 1);
}

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function parseWeekday(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function mapPlace(
  place: PlacesPlace,
  centre: { latitude: number; longitude: number } | null,
  retrievedAt: string,
): Business {
  const latitude = place.location?.latitude ?? 0;
  const longitude = place.location?.longitude ?? 0;

  const periods = place.regularOpeningHours?.periods ?? [];
  const hours = periods.length
    ? periods.map((p) => ({
        day: p.open.day,
        open: parseWeekday(p.open.hour, p.open.minute),
        close: p.close ? parseWeekday(p.close.hour, p.close.minute) : null,
        closed: !p.close,
      }))
    : [];

  const isOpenBusiness = (place.businessStatus ?? "OPERATIONAL") === "OPERATIONAL";
  const websiteStatus: WebsiteStatus = place.websiteUri ? "has_website" : "no_website";

  return {
    id: place.id,
    name: place.displayName?.text ?? "Unknown business",
    category: place.primaryTypeDisplayName?.text ?? "Business",
    categories: place.types ?? [],
    location: {
      city: place.shortFormattedAddress?.split(",").slice(-2, -1)[0]?.trim() ?? "",
      region: undefined,
      country: undefined,
      formatted: place.formattedAddress ?? place.shortFormattedAddress ?? "",
      latitude,
      longitude,
    },
    distanceMiles: centre ? haversineMiles(centre, { latitude, longitude }) : null,
    providerUpdatedAt: retrievedAt,
    phone: place.nationalPhoneNumber ?? null,
    // Google Places does not publish WhatsApp availability — never assume it.
    whatsappAvailable: false,
    // Places has no public email field; leave it null rather than guessing.
    email: null,
    website: place.websiteUri ?? null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    priceLevel: place.priceLevel ? PRICE_MAP[place.priceLevel] ?? null : null,
    description: place.editorialSummary?.text ?? null,
    hours,
    photoUrl: place.photos?.[0]?.name ? `places-photo://${place.photos[0].name}` : null,
    logoUrl: null,
    social: {},
    websiteStatus,
    provenance: {
      provider: META.id,
      providerLabel: META.label,
      kind: "live",
      verifiedListing: false,
      retrievedAt,
      notes: isOpenBusiness
        ? undefined
        : "The provider reports this business as temporarily or permanently closed.",
    },
  };
}

const SORTERS: Record<SortKey, (a: Business, b: Business) => number> = {
  // The provider already returns results in relevance order for these keys.
  relevance: () => 0,
  newest: () => 0,
  distance: (a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  website_opportunity: (a, b) =>
    Number(b.websiteStatus === "no_website") - Number(a.websiteStatus === "no_website"),
};

export function createGooglePlacesProvider(apiKey: string): BusinessSearchProvider {
  const centreCache = new Map<string, { latitude: number; longitude: number } | null>();

  async function callTextSearch(body: unknown) {
    const res = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const json = (await res.json()) as PlacesResponse;
    if (!res.ok) {
      const message = json.error?.message ?? `Places API responded with ${res.status}`;
      if (res.status === 429) {
        throw new AppError("rate_limited", "The business-data provider rate-limited this request.", message);
      }
      if (res.status === 400 || res.status === 403) {
        throw new AppError(
          "provider_not_configured",
          "The business-data provider rejected the request.",
          message,
        );
      }
      throw new AppError("network", "The business-data provider could not be reached.", message);
    }
    return json;
  }

  async function resolveCentre(location: string) {
    if (centreCache.has(location)) return centreCache.get(location)!;
    try {
      const json = await callTextSearch({ textQuery: location, maxResultCount: 1 });
      const place = json.places?.[0];
      const centre = place?.location
        ? { latitude: place.location.latitude, longitude: place.location.longitude }
        : null;
      centreCache.set(location, centre);
      return centre;
    } catch {
      centreCache.set(location, null);
      return null;
    }
  }

  return {
    meta: META,
    isConfigured: () => apiKey.trim().length > 0,

    async search(query: SearchQuery): Promise<SearchResponse> {
      const retrievedAt = new Date().toISOString();
      const centre = await resolveCentre(query.location);
      const filters = query.filters ?? EMPTY_FILTERS;

      // Places returns max 20 per page; walk pages until we have enough or run out.
      const wanted = Math.min(Math.max(query.pageSize * query.page, 20), 60);
      const collected: Business[] = [];
      let pageToken: string | undefined;

      for (let i = 0; i < 3 && collected.length < wanted; i += 1) {
        const json = await callTextSearch({
          textQuery: `${query.term} in ${query.location}`,
          maxResultCount: 20,
          ...(centre
            ? {
                locationBias: {
                  circle: {
                    center: { latitude: centre.latitude, longitude: centre.longitude },
                    radius: Math.min(query.radiusMiles * 1609.34, 50000),
                  },
                },
              }
            : {}),
          ...(pageToken ? { pageToken } : {}),
        });

        const mapped = (json.places ?? []).map((p) => mapPlace(p, centre, retrievedAt));
        collected.push(...mapped);
        pageToken = json.nextPageToken;
        if (!pageToken) break;
      }

      // Radius + filters are applied client-of-provider so results always honour
      // what the user asked for, even if the vendor's bias is only a hint.
      const withinRadius = collected.filter((b) =>
        filters.maxDistanceMiles === null || b.distanceMiles === null
          ? true
          : b.distanceMiles <= query.radiusMiles,
      );

      const filtered = withinRadius.filter((b) => {
        if (filters.websiteStatus.length && !filters.websiteStatus.includes(b.websiteStatus)) return false;
        if (filters.contact.includes("phone") && !b.phone) return false;
        if (filters.contact.includes("email") && !b.email) return false;
        if (filters.contact.includes("whatsapp") && !b.whatsappAvailable) return false;
        if (filters.minRating !== null && (b.rating ?? 0) < filters.minRating) return false;
        if (filters.maxDistanceMiles !== null && (b.distanceMiles ?? 0) > filters.maxDistanceMiles) return false;
        if (filters.categories.length && !filters.categories.includes(b.category)) return false;
        return true;
      });

      const sorter = SORTERS[query.sort] ?? SORTERS.relevance;
      const sorted = sorter === SORTERS.relevance ? filtered : [...filtered].sort(sorter);

      const start = (query.page - 1) * query.pageSize;
      const businesses = sorted.slice(start, start + query.pageSize);
      const facets = buildFacets(withinRadius);
      // No website reviews are run inside search, so nothing is claimed about site quality here.
      const summary = buildSummary(sorted);

      return {
        query,
        businesses,
        total: sorted.length,
        unfilteredTotal: withinRadius.length,
        summary,
        categoryBreakdown: facets.categories,
        facets,
        provider: {
          provider: META.id,
          providerLabel: META.label,
          kind: "live",
          verifiedListing: false,
          retrievedAt,
          notes:
            "Business data supplied by Google Places. Public email addresses and WhatsApp availability are not published by this provider.",
        },
        isDemoData: false,
        hasMore: start + businesses.length < sorted.length,
        notices: [
          "Live provider: Google Places. Fields the provider does not publish (email, WhatsApp) are shown as unavailable rather than guessed.",
        ],
      };
    },

    async getById(id: string) {
      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
        headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK.replace("places.", "") },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const place = (await res.json()) as PlacesPlace;
      if (!place?.id) return null;
      return mapPlace(place, null, new Date().toISOString());
    },

    async getCategoryBreakdown() {
      // A real implementation would call the vendor's aggregate/insights endpoint.
      return [];
    },
  };
}
