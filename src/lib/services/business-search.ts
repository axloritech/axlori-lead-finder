import { getBusinessProvider } from "@/lib/providers";
import { AppError } from "@/lib/config";
import { DEFAULT_RADIUS, EMPTY_FILTERS } from "@/lib/constants";
import { aiLeadAnalysisService } from "@/lib/services/ai-lead-analysis";
import { websiteAnalysisService } from "@/lib/services/website-analysis";
import type {
  AILeadInsight,
  Business,
  SearchQuery,
  SearchResponse,
  WebsiteAnalysis,
} from "@/lib/types";

/**
 * businessSearchService
 *
 * The only thing the UI (and the API routes) should ever call. It normalises the
 * query, delegates to the configured provider and, importantly, never lets a
 * provider error escape as an unhandled exception.
 */

export const DEFAULT_PAGE_SIZE = 24;

export function normaliseQuery(input: Partial<SearchQuery>): SearchQuery {
  const term = (input.term ?? "").trim();
  const location = (input.location ?? "").trim();

  if (term.length < 2) {
    throw new AppError(
      "invalid_query",
      "Enter a business type to search for.",
      "For example “Barber shop”, “Restaurant” or “Dental clinic”.",
    );
  }
  if (location.length < 2) {
    throw new AppError(
      "invalid_location",
      "Enter a location to search in.",
      "For example “Columbus, Ohio”. You can also try “Lagos, Nigeria”.",
    );
  }

  return {
    term,
    location,
    radiusMiles: Number.isFinite(input.radiusMiles) ? Number(input.radiusMiles) : DEFAULT_RADIUS,
    filters: { ...EMPTY_FILTERS, ...(input.filters ?? {}) },
    sort: input.sort ?? "relevance",
    page: Number.isFinite(input.page) ? Math.max(1, Number(input.page)) : 1,
    pageSize: Number.isFinite(input.pageSize)
      ? Math.min(Math.max(1, Number(input.pageSize)), 100)
      : DEFAULT_PAGE_SIZE,
  };
}

export const businessSearchService = {
  providerMeta() {
    return getBusinessProvider().status;
  },

  async search(input: Partial<SearchQuery>): Promise<SearchResponse> {
    const query = normaliseQuery(input);
    const { provider } = getBusinessProvider();
    try {
      return await provider.search(query);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "network",
        "The business search could not be completed.",
        error instanceof Error ? error.message : undefined,
      );
    }
  },

  async getById(id: string): Promise<Business | null> {
    const { provider } = getBusinessProvider();
    return provider.getById(id);
  },

  /** Business + website review + AI insight, with each step independently safe. */
  async getBusinessDossier(
    id: string,
    options?: { force?: boolean },
  ): Promise<{ business: Business; analysis: WebsiteAnalysis; insight: AILeadInsight } | null> {
    const business = await this.getById(id);
    if (!business) return null;
    const analysis = await websiteAnalysisService.analyse(business, options);
    const insight = await aiLeadAnalysisService.analyse(business, analysis, options);
    return { business, analysis, insight };
  },

  async getCategoryBreakdown(location: string) {
    const { provider } = getBusinessProvider();
    return provider.getCategoryBreakdown(location);
  },
};

export type BusinessSearchService = typeof businessSearchService;
