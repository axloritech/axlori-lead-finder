import { getAIProvider } from "@/lib/providers";
import { AppError } from "@/lib/config";
import { MESSAGING } from "@/lib/constants";
import type { AILeadInsight, Business, WebsiteAnalysis } from "@/lib/types";

/**
 * aiLeadAnalysisService
 *
 * Wraps the configured AI provider. When the provider is unreachable the UI gets a
 * clearly-labelled "unavailable" object (with the underlying reason) rather than an
 * exception that would take the page down. Information the app cannot support is
 * never presented as insight.
 */

const cache = new Map<string, AILeadInsight>();

function unavailableInsight(business: Business, reason: string): AILeadInsight {
  return {
    id: `insight-${business.id}`,
    businessId: business.id,
    generatedAt: new Date().toISOString(),
    model: "unavailable",
    mode: "demo",
    summary: "AI analysis is unavailable right now.",
    observations: [],
    opportunities: [],
    opportunityScore: 0,
    confidence: "low",
    dataGaps: [reason],
    disclaimer: MESSAGING.aiDisclaimer,
  };
}

export const aiLeadAnalysisService = {
  providerMeta() {
    return getAIProvider().status;
  },

  async analyse(
    business: Business,
    website?: WebsiteAnalysis | null,
    options?: { force?: boolean },
  ): Promise<AILeadInsight> {
    const key = `${business.id}::${website?.checkedAt ?? "none"}::${website?.status ?? "none"}`;
    if (!options?.force) {
      const hit = cache.get(key);
      if (hit) return hit;
    }

    try {
      const { provider } = getAIProvider();
      const insight = await provider.analyseLead(business, website ?? null);
      cache.set(key, insight);
      return insight;
    } catch (error) {
      const reason =
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown AI provider error.";
      return unavailableInsight(business, reason);
    }
  },

  clear() {
    cache.clear();
  },
};

export type AILeadAnalysisService = typeof aiLeadAnalysisService;
