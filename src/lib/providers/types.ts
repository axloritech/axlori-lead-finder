import type {
  AILeadInsight,
  Business,
  OutreachChannel,
  OutreachDraft,
  OutreachTemplate,
  SearchQuery,
  SearchResponse,
  WebsiteAnalysis,
} from "@/lib/types";

/**
 * Provider contracts.
 *
 * Every capability the product needs is expressed as a small interface so a real
 * vendor can be dropped in behind it without touching the UI:
 *
 *   BusinessSearchProvider  → Google Places / Yelp / Foursquare / internal API
 *   WebsiteAnalysisProvider → PageSpeed Insights, a crawler service, or an in-house job
 *   AIProvider              → OpenAI / Anthropic / local model
 *   OutreachProvider        → template engine or an LLM
 *
 * The `services/` layer picks the right implementation at runtime (see
 * `src/lib/providers/index.ts`) and the UI only ever imports the services.
 */

export interface ProviderMeta {
  id: string;
  label: string;
  kind: "demo" | "live";
  /** True when the provider returned a complete, production-quality dataset. */
  productionReady: boolean;
}

export interface BusinessSearchProvider {
  readonly meta: ProviderMeta;
  /** Reports whether the provider has everything it needs (API key, base url…). */
  isConfigured(): boolean;
  search(query: SearchQuery): Promise<SearchResponse>;
  getById(id: string): Promise<Business | null>;
  /** Used to power filter counts and dashboard statistics. */
  getCategoryBreakdown(location: string): Promise<{ category: string; count: number }[]>;
}

export interface WebsiteAnalysisProvider {
  readonly meta: ProviderMeta;
  isConfigured(): boolean;
  analyse(business: Business): Promise<WebsiteAnalysis>;
}

export interface AIProvider {
  readonly meta: ProviderMeta;
  isConfigured(): boolean;
  analyseLead(business: Business, website?: WebsiteAnalysis | null): Promise<AILeadInsight>;
  generateOutreach(input: {
    business: Business;
    website?: WebsiteAnalysis | null;
    template: OutreachTemplate;
    channel: OutreachChannel;
    tone?: "friendly" | "professional" | "direct";
    signature?: string;
  }): Promise<OutreachDraft>;
}

export type { SearchQuery, SearchResponse, WebsiteAnalysis, AILeadInsight, OutreachDraft };
