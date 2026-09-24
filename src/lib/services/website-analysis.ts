import { getWebsiteProvider } from "@/lib/providers";
import type { Business, WebsiteAnalysis } from "@/lib/types";

/**
 * websiteAnalysisService
 *
 * Single entry point for website reviews. Caches per URL so a business is never
 * analysed twice in the same process, and degrades gracefully: a failure on one
 * business returns an "unavailable" result instead of throwing into the UI.
 */

const cache = new Map<string, WebsiteAnalysis>();

const unavailable = (business: Business, message: string): WebsiteAnalysis => ({
  businessId: business.id,
  url: business.website ?? "",
  status: "unknown",
  score: null,
  checkedAt: new Date().toISOString(),
  reachable: null,
  checks: [],
  observations: [message],
  measurement: { mode: "none", note: message },
});

export const websiteAnalysisService = {
  providerMeta() {
    return getWebsiteProvider().status;
  },

  async analyse(business: Business, options?: { force?: boolean }): Promise<WebsiteAnalysis> {
    if (!business.website) return unavailable(business, "No website address is published for this business.");

    const key = `${business.id}::${business.website}`;
    if (!options?.force) {
      const hit = cache.get(key);
      if (hit) return hit;
    }

    try {
      const { provider } = getWebsiteProvider();
      const analysis = await provider.analyse(business);
      cache.set(key, analysis);
      return analysis;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Website analysis is unavailable at the moment.";
      return unavailable(business, message);
    }
  },

  /** Analyse many businesses without letting a single failure reject the batch. */
  async analyseBatch(businesses: Business[]): Promise<Map<string, WebsiteAnalysis>> {
    const results = await Promise.all(
      businesses.map(async (b) => [b.id, await this.analyse(b)] as const),
    );
    return new Map(results);
  },

  clear() {
    cache.clear();
  },
};

export type WebsiteAnalysisService = typeof websiteAnalysisService;
