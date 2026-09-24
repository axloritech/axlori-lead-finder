/**
 * Core domain types for Axlori Lead Finder.
 *
 * These types are intentionally provider-agnostic. Any legitimate business-data
 * provider (Google Places API, Yelp Fusion, Foursquare, OpenStreetMap, an internal
 * dataset, …) is expected to map its payload onto these shapes inside an adapter
 * that lives in `src/lib/providers/*`. The UI never talks to a provider directly —
 * it only ever sees these types.
 */

/* -------------------------------------------------------------------------- */
/*  Provenance & honesty primitives                                           */
/* -------------------------------------------------------------------------- */

export type DataSourceKind = "demo" | "live";

/** Where a piece of information came from. Surfaced in the UI. */
export type Provenance = "provider" | "verified" | "derived" | "ai";

export interface DataProvenance {
  /** Stable provider id, e.g. "demo" | "google_places" | "yelp". */
  provider: string;
  providerLabel: string;
  /** `demo` means generated sample data, never a real business record. */
  kind: DataSourceKind;
  /** Provider states the listing is claimed/verified by the business. */
  verifiedListing: boolean;
  /** When the record was retrieved from the provider (ISO 8601). */
  retrievedAt: string;
  notes?: string;
}

/* -------------------------------------------------------------------------- */
/*  Business                                                                   */
/* -------------------------------------------------------------------------- */

export interface BusinessLocation {
  city: string;
  region?: string;
  country?: string;
  postalCode?: string;
  formatted: string;
  latitude: number;
  longitude: number;
}

export interface OpeningHours {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  open: string | null;
  close: string | null;
  closed?: boolean;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  x?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
}

export interface Business {
  id: string;
  name: string;
  /** Canonical category label, e.g. "Barber Shop". */
  category: string;
  /** Raw provider categories, if any. */
  categories: string[];
  location: BusinessLocation;
  /** Straight-line distance from the search centre, in miles. */
  distanceMiles: number | null;
  /** ISO 8601 date the provider last updated the record. */
  providerUpdatedAt: string | null;

  phone: string | null;
  /** Provider indicates the number is reachable on WhatsApp Business. */
  whatsappAvailable: boolean;
  email: string | null;
  website: string | null;

  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;

  description: string | null;
  hours: OpeningHours[];
  photoUrl: string | null;
  logoUrl: string | null;
  social: SocialLinks;

  /** Computed once so the UI never has to re-derive it. */
  websiteStatus: WebsiteStatus;
  /** Optional cheap hint for list views. Absent when the provider can't supply one. */
  websiteCheckPreview?: WebsiteCheckPreview | null;
  provenance: DataProvenance;
}

export type WebsiteStatus =
  | "has_website"
  | "no_website"
  | "unknown_website_status";

/**
 * A cheap, provider-supplied hint about a website that travels with the listing
 * so result cards can show a status without triggering a full analysis per row.
 * Live providers that cannot supply this leave it undefined and the UI says
 * "Not checked" rather than guessing.
 */
export interface WebsiteCheckPreview {
  status: CheckStatus;
  note: string;
  mode: "live" | "heuristic" | "none";
}

/* -------------------------------------------------------------------------- */
/*  Search                                                                     */
/* -------------------------------------------------------------------------- */

export type ContactFilterKey = "phone" | "email" | "whatsapp";

export interface SearchFilters {
  websiteStatus: WebsiteStatus[];
  contact: ContactFilterKey[];
  minRating: number | null;
  maxDistanceMiles: number | null;
  /** Canonical category ids to include (empty = all). */
  categories: string[];
}

export type SortKey =
  | "relevance"
  | "distance"
  | "rating"
  | "newest"
  | "website_opportunity";

export interface SearchQuery {
  term: string;
  location: string;
  radiusMiles: number;
  filters: SearchFilters;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export interface SearchSummary {
  total: number;
  hasWebsite: number;
  noWebsite: number;
  unknownWebsite: number;
  needsImprovement: number;
  /** How many websites were actually reviewed to produce `needsImprovement`. */
  analysedWebsites: number;
  emailAvailable: number;
  phoneAvailable: number;
  whatsappAvailable: number;
}

/** Counts per filter option, computed before filters are applied. */
export interface FilterFacets {
  websiteStatus: Record<WebsiteStatus, number>;
  contact: Record<ContactFilterKey, number>;
  categories: { category: string; count: number }[];
}

export interface SearchResponse {
  query: SearchQuery;
  businesses: Business[];
  total: number;
  /** Total matched by the query *before* UI filters were applied (for filter counts). */
  unfilteredTotal: number;
  summary: SearchSummary;
  categoryBreakdown: { category: string; count: number }[];
  facets: FilterFacets;
  provider: DataProvenance;
  /** True when the rows are generated sample data rather than a live provider. */
  isDemoData: boolean;
  hasMore: boolean;
  notices: string[];
}

/* -------------------------------------------------------------------------- */
/*  Website analysis                                                           */
/* -------------------------------------------------------------------------- */

export type CheckStatus = "good" | "needs_improvement" | "unknown" | "not_checked";

export type WebsiteCheckId =
  | "mobile_friendly"
  | "modern_design"
  | "page_speed"
  | "online_booking"
  | "contact_information"
  | "clear_call_to_action"
  | "https"
  | "basic_seo"
  | "social_links"
  | "online_menu_or_catalog";

export interface WebsiteCheck {
  id: WebsiteCheckId;
  label: string;
  status: CheckStatus;
  /** Short, factual note about what was observed (or not observed). */
  detail?: string;
}

export interface WebsiteAnalysis {
  businessId: string;
  url: string;
  status: CheckStatus;
  /** 0–100 opportunity-free "quality" score, only when checks were actually run. */
  score: number | null;
  checkedAt: string;
  reachable: boolean | null;
  checks: WebsiteCheck[];
  /** Plain-language, observation-only summary. Never a fabricated measurement. */
  observations: string[];
  measurement: {
    /** `live` = a real fetch/API call ran. `heuristic` = derived from listing hints. */
    mode: "live" | "heuristic" | "none";
    note: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  AI insight & outreach                                                      */
/* -------------------------------------------------------------------------- */

export type Impact = "high" | "medium" | "low";

export interface AIOpportunity {
  title: string;
  detail: string;
  impact: Impact;
  /** Which observable fact this is based on — keeps the AI accountable. */
  basedOn: string;
}

export interface AILeadInsight {
  id: string;
  businessId: string;
  generatedAt: string;
  model: string;
  mode: DataSourceKind;
  /** Neutral, factual summary of what is known about the business. */
  summary: string;
  /** Things the data actually shows. */
  observations: string[];
  /** Potential web-development opportunities. Framed as suggestions, not claims. */
  opportunities: AIOpportunity[];
  /** 0–100 heuristic used for ranking leads by opportunity. */
  opportunityScore: number;
  confidence: Impact;
  dataGaps: string[];
  disclaimer: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  description: string;
  channel: OutreachChannel;
  subject: string;
  body: string;
  builtIn?: boolean;
  updatedAt: string;
}

export type OutreachChannel = "email" | "whatsapp";

export interface OutreachDraft {
  id: string;
  businessId: string;
  businessName: string;
  templateId: string;
  channel: OutreachChannel;
  subject: string | null;
  body: string;
  generatedAt: string;
  model: string;
  mode: DataSourceKind;
  /** Which business facts were woven into the draft — shown to the user. */
  personalization: string[];
  disclaimer: string;
}

/* -------------------------------------------------------------------------- */
/*  Saved leads                                                                */
/* -------------------------------------------------------------------------- */

export type LeadStatus = "new" | "contacted" | "replied" | "converted" | "not_interested";

export interface SavedLead {
  businessId: string;
  /** Denormalised snapshot so the Saved screen renders instantly & offline. */
  snapshot: {
    name: string;
    category: string;
    city: string;
    region?: string;
    websiteStatus: WebsiteStatus;
    phone: string | null;
    email: string | null;
    website: string | null;
    whatsappAvailable: boolean;
    rating: number | null;
    reviewCount: number | null;
    photoUrl: string | null;
  };
  status: LeadStatus;
  note: string;
  savedAt: string;
  lastContactedAt: string | null;
  contactChannel: OutreachChannel | null;
}

/* -------------------------------------------------------------------------- */
/*  App-wide stats                                                             */
/* -------------------------------------------------------------------------- */

export interface DashboardStats {
  businessesFound: number;
  withWebsites: number;
  withoutWebsites: number;
  needingImprovement: number;
  emailsAvailable: number;
  phonesAvailable: number;
  whatsappAvailable: number;
  savedLeads: number;
  contactedLeads: number;
}

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

export type AppErrorCode =
  | "provider_not_configured"
  | "invalid_location"
  | "invalid_query"
  | "no_results"
  | "website_unavailable"
  | "website_analysis_unavailable"
  | "ai_unavailable"
  | "rate_limited"
  | "network"
  | "unknown";

export interface AppErrorShape {
  code: AppErrorCode;
  message: string;
  hint?: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: AppErrorShape;
}
