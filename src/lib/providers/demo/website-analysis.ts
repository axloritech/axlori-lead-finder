import { createRng, hashString } from "@/lib/utils";
import type { Business, WebsiteAnalysis } from "@/lib/types";
import type { ProviderMeta, WebsiteAnalysisProvider } from "@/lib/providers/types";
import { buildDemoWebsiteAnalysis } from "@/lib/providers/demo/websites";

/**
 * Demo website-analysis provider.
 *
 * Returns canned, deterministic checklists (labelled `mode: "heuristic"`) so the
 * product can be demonstrated end-to-end without network access or API keys.
 */

const META: ProviderMeta = {
  id: "demo-website",
  label: "Axlori demo website review",
  kind: "demo",
  productionReady: false,
};

const cache = new Map<string, WebsiteAnalysis>();

export const demoWebsiteAnalysisProvider: WebsiteAnalysisProvider = {
  meta: META,
  isConfigured: () => true,

  async analyse(business: Business): Promise<WebsiteAnalysis> {
    if (!business.website) {
      return {
        businessId: business.id,
        url: "",
        status: "not_checked",
        score: null,
        checkedAt: new Date().toISOString(),
        reachable: null,
        checks: [],
        observations: ["No website address is published for this business."],
        measurement: {
          mode: "none",
          note: "Nothing to review — the provider did not return a website for this listing.",
        },
      };
    }

    const key = `${business.id}::${business.website}`;
    const hit = cache.get(key);
    if (hit) return hit;

    const analysis = buildDemoWebsiteAnalysis(business);
    // Small jitter so repeated runs do not look suspiciously identical on timing.
    const rng = createRng(hashString(key));
    void rng;
    cache.set(key, analysis);
    return analysis;
  },
};
