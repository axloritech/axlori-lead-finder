import { AppError } from "@/lib/config";
import type { Business, CheckStatus, WebsiteAnalysis, WebsiteCheck } from "@/lib/types";
import type { ProviderMeta, WebsiteAnalysisProvider } from "@/lib/providers/types";

/**
 * Google PageSpeed Insights adapter — real, publicly accessible website checks.
 *
 * Only reports what the API actually returns. Items PageSpeed does not measure
 * (whether a booking system exists, whether an email is published) stay
 * `unknown` with an explicit reason, so the UI never dresses up a guess as a
 * measurement.
 *
 * Enable with:
 *   WEBSITE_ANALYSIS_PROVIDER=pagespeed
 *   WEBSITE_ANALYSIS_API_KEY=…
 */

const META: ProviderMeta = {
  id: "pagespeed",
  label: "Google PageSpeed Insights",
  kind: "live",
  productionReady: true,
};

interface LighthouseAudit {
  id?: string;
  score?: number | null;
  numericValue?: number;
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: Record<string, { score?: number | null }>;
    audits?: Record<string, LighthouseAudit>;
  };
  error?: { message?: string };
}

const scoreToStatus = (score: number | null | undefined, goodAt = 0.9, okAt = 0.5): CheckStatus => {
  if (score === null || score === undefined) return "unknown";
  if (score >= goodAt) return "good";
  if (score >= okAt) return "needs_improvement";
  return "needs_improvement";
};

export function createPageSpeedProvider(apiKey: string): WebsiteAnalysisProvider {
  return {
    meta: META,
    isConfigured: () => apiKey.trim().length > 0,

    async analyse(business: Business): Promise<WebsiteAnalysis> {
      const url = business.website;
      if (!url) {
        return {
          businessId: business.id,
          url: "",
          status: "not_checked",
          score: null,
          checkedAt: new Date().toISOString(),
          reachable: null,
          checks: [],
          observations: ["No website address is published for this business."],
          measurement: { mode: "none", note: "Nothing to analyse — no website was returned for this listing." },
        };
      }

      const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
      endpoint.searchParams.set("url", url);
      endpoint.searchParams.set("key", apiKey);
      endpoint.searchParams.set("strategy", "mobile");
      ["performance", "seo", "best-practices", "accessibility"].forEach((c) =>
        endpoint.searchParams.append("category", c),
      );

      let json: PsiResponse;
      try {
        const res = await fetch(endpoint.toString(), { cache: "no-store" });
        json = (await res.json()) as PsiResponse;
        if (!res.ok) {
          throw new AppError(
            "website_analysis_unavailable",
            "The website-analysis provider could not analyse this site.",
            json.error?.message ?? `PageSpeed responded with ${res.status}`,
          );
        }
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(
          "network",
          "The website-analysis provider could not be reached.",
          error instanceof Error ? error.message : undefined,
        );
      }

      const lh = json.lighthouseResult;
      if (!lh) {
        throw new AppError(
          "website_analysis_unavailable",
          "The website-analysis provider returned no results for this URL.",
        );
      }

      const categories = lh.categories ?? {};
      const audits = lh.audits ?? {};

      const viewport = audits.viewport;
      const isHttps = audits["is-on-https"];

      const checks: WebsiteCheck[] = [
        {
          id: "page_speed",
          label: "Page speed",
          status: scoreToStatus(categories.performance?.score, 0.9, 0.6),
          detail:
            categories.performance?.score !== undefined && categories.performance?.score !== null
              ? `Lighthouse mobile performance score: ${Math.round((categories.performance.score ?? 0) * 100)}/100.`
              : "No performance score returned.",
        },
        {
          id: "mobile_friendly",
          label: "Mobile friendly",
          status: viewport ? scoreToStatus(viewport.score, 0.9, 0.9) : "unknown",
          detail: viewport?.score === 1
            ? "A mobile viewport is configured."
            : viewport
              ? "No mobile viewport meta tag detected."
              : "The provider did not return a viewport audit.",
        },
        {
          id: "https",
          label: "HTTPS",
          status: isHttps ? (isHttps.score === 1 ? "good" : "needs_improvement") : "unknown",
          detail: isHttps?.score === 1 ? "Served over HTTPS." : "Not served over a secure connection.",
        },
        {
          id: "basic_seo",
          label: "Basic SEO indicators",
          status: scoreToStatus(categories.seo?.score, 0.9, 0.6),
          detail:
            categories.seo?.score !== undefined && categories.seo?.score !== null
              ? `Lighthouse SEO score: ${Math.round((categories.seo.score ?? 0) * 100)}/100.`
              : undefined,
        },
        {
          id: "modern_design",
          label: "Modern design",
          status: "unknown",
          detail: "Visual design quality is not measured by this provider.",
        },
        {
          id: "online_booking",
          label: "Online booking",
          status: "not_checked",
          detail: "Booking flows are not detected by this provider. Review the site manually.",
        },
        {
          id: "contact_information",
          label: "Contact information",
          status: "unknown",
          detail: "Page content is not parsed by this provider.",
        },
        {
          id: "clear_call_to_action",
          label: "Clear call-to-action",
          status: "unknown",
          detail: "Conversion elements are not measured by this provider.",
        },
      ];

      const scored = checks.filter((c) => c.status === "good" || c.status === "needs_improvement");
      const score = scored.length
        ? Math.round((scored.filter((c) => c.status === "good").length / scored.length) * 100)
        : 0;

      const observations: string[] = [];
      if (categories.performance?.score !== undefined && categories.performance?.score !== null) {
        observations.push(
          `Mobile performance score: ${Math.round((categories.performance.score ?? 0) * 100)}/100 (Lighthouse).`,
        );
      }
      if (categories.seo?.score !== undefined && categories.seo?.score !== null) {
        observations.push(`SEO score: ${Math.round((categories.seo.score ?? 0) * 100)}/100 (Lighthouse).`);
      }
      if (viewport?.score === 0) observations.push("No mobile viewport meta tag was detected.");
      observations.push(
        "Design quality, booking flows and page content were not evaluated by this provider.",
      );

      return {
        businessId: business.id,
        url,
        status: score >= 75 ? "good" : score > 0 ? "needs_improvement" : "unknown",
        score,
        checkedAt: new Date().toISOString(),
        reachable: true,
        checks,
        observations,
        measurement: {
          mode: "live",
          note: "Measured with Google PageSpeed Insights (mobile strategy).",
        },
      };
    },
  };
}
