import type { SearchFilters, SortKey, WebsiteStatus } from "@/lib/types";

export const APP = {
  name: "Axlori Lead Finder",
  shortName: "Axlori",
  tagline: "Find businesses. Build opportunities.",
  description:
    "AI-powered prospecting for web developers and agencies: find local businesses, check their online presence and turn them into clients.",
  version: "1.0.0-demo",
} as const;

export const RADIUS_OPTIONS = [5, 10, 15, 25, 40, 50, 100] as const;

export const RATING_OPTIONS = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3.0 ★ & up" },
  { value: 3.5, label: "3.5 ★ & up" },
  { value: 4, label: "4.0 ★ & up" },
  { value: 4.5, label: "4.5 ★ & up" },
] as const;

export const DEFAULT_RADIUS = 25;

export const SORT_OPTIONS: { value: SortKey; label: string; hint: string }[] = [
  { value: "relevance", label: "Most Relevant", hint: "Best overall match for your search" },
  { value: "website_opportunity", label: "Website Opportunity", hint: "Ranked by likely web work" },
  { value: "distance", label: "Distance", hint: "Closest to your search location" },
  { value: "rating", label: "Rating", hint: "Highest rated first" },
  { value: "newest", label: "Newest", hint: "Recently updated listings first" },
];

export const EMPTY_FILTERS: SearchFilters = {
  websiteStatus: [],
  contact: [],
  minRating: null,
  maxDistanceMiles: null,
  categories: [],
};

export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, string> = {
  has_website: "Has website",
  no_website: "No website",
  unknown_website_status: "Website unchecked",
};

export const WEBSITE_STATUS_SHORT: Record<WebsiteStatus, string> = {
  has_website: "Has Website",
  no_website: "No Website",
  unknown_website_status: "Unknown",
};

export const POPULAR_SEARCHES = [
  { term: "Barber shop", location: "Columbus, Ohio" },
  { term: "Restaurant", location: "Austin, Texas" },
  { term: "Hair salon", location: "Columbus, Ohio" },
  { term: "Dental clinic", location: "Denver, Colorado" },
  { term: "Gym", location: "Phoenix, Arizona" },
  { term: "Real estate agency", location: "Charlotte, North Carolina" },
] as const;

export const STORAGE_KEYS = {
  leads: "axlori.leads.v1",
  templates: "axlori.templates.v1",
  searchHistory: "axlori.search-history.v1",
  settings: "axlori.settings.v1",
  lastSearch: "axlori.last-search.v1",
} as const;

export const MAX_SEARCH_HISTORY = 8;

/** Contact-preference thresholds — kept in one place so UI copy stays consistent. */
export const MESSAGING = {
  noAutoSendTitle: "Nothing is sent automatically",
  noAutoSendBody:
    "Axlori opens your own email app or WhatsApp with the message pre-filled. You stay in control of what goes out.",
  demoDataTitle: "Demo data",
  demoDataBody:
    "These businesses are generated sample records used to demonstrate the product. Connect a business-data provider in Settings to search real, publicly available listings.",
  aiDisclaimer:
    "AI-generated suggestions based on the information available. Review before you use it.",
} as const;
