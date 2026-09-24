import { AppError, providerNotConfigured, serverEnv } from "@/lib/config";
import type {
  AIProvider,
  BusinessSearchProvider,
  WebsiteAnalysisProvider,
} from "@/lib/providers/types";
import { demoBusinessSearchProvider } from "@/lib/providers/demo/business-search";
import { demoAIProvider } from "@/lib/providers/demo/ai";
import { demoWebsiteAnalysisProvider } from "@/lib/providers/demo/website-analysis";
import { createGooglePlacesProvider } from "@/lib/providers/google-places";
import { createPageSpeedProvider } from "@/lib/providers/pagespeed";
import { createOpenAIProvider } from "@/lib/providers/openai";

/**
 * Provider registry.
 *
 * Selection is driven entirely by environment variables, so connecting a real
 * vendor never touches the UI:
 *
 *   BUSINESS_DATA_PROVIDER = demo | google_places
 *   BUSINESS_DATA_API_KEY  = <key>            (server-only)
 *   WEBSITE_ANALYSIS_PROVIDER = demo | pagespeed
 *   WEBSITE_ANALYSIS_API_KEY  = <key>         (server-only)
 *   AI_PROVIDER = demo | openai
 *   AI_API_KEY  = <key>                       (server-only)
 *
 * Any provider that fails to configure falls back to the demo implementation and
 * reports why, rather than crashing the app.
 */

/** Which capability a provider fulfils. */
export type ProviderRole = "business" | "website" | "ai";

export interface ProviderStatus {
  id: string;
  label: string;
  role: ProviderRole;
  kind: "demo" | "live";
  configured: boolean;
  reason?: string;
}

const role = (r: ProviderRole) => ({ role: r });

function resolveBusinessProvider(): { provider: BusinessSearchProvider; status: ProviderStatus } {
  const id = serverEnv.businessProvider;

  if (id === "google_places") {
    if (!serverEnv.businessProviderApiKey) {
      return {
        provider: demoBusinessSearchProvider,
        status: {
          id: "demo",
          label: demoBusinessSearchProvider.meta.label,
          ...role("business"),
          kind: "demo",
          configured: false,
          reason:
            "BUSINESS_DATA_PROVIDER is set to google_places but BUSINESS_DATA_API_KEY is missing, so demo data is being served.",
        },
      };
    }
    const provider = createGooglePlacesProvider(serverEnv.businessProviderApiKey);
    return { provider, status: { ...provider.meta, ...role("business"), configured: true } };
  }

  if (id !== "demo") {
    return {
      provider: demoBusinessSearchProvider,
      status: {
        id: "demo",
        label: demoBusinessSearchProvider.meta.label,
        ...role("business"),
        kind: "demo",
        configured: false,
        reason: `No registered business-data adapter for “${id}”. Implement BusinessSearchProvider in src/lib/providers and register it here.`,
      },
    };
  }

  return {
    provider: demoBusinessSearchProvider,
    status: { id: "demo", label: demoBusinessSearchProvider.meta.label, ...role("business"), kind: "demo", configured: true },
  };
}

function resolveWebsiteProvider(): { provider: WebsiteAnalysisProvider; status: ProviderStatus } {
  const id = serverEnv.websiteProvider;

  if (id === "pagespeed") {
    if (!serverEnv.websiteProviderApiKey) {
      return {
        provider: demoWebsiteAnalysisProvider,
        status: {
          id: "demo",
          label: demoWebsiteAnalysisProvider.meta.label,
          ...role("website"),
          kind: "demo",
          configured: false,
          reason:
            "WEBSITE_ANALYSIS_PROVIDER is set to pagespeed but WEBSITE_ANALYSIS_API_KEY is missing, so demo analysis is being served.",
        },
      };
    }
    const provider = createPageSpeedProvider(serverEnv.websiteProviderApiKey);
    return { provider, status: { ...provider.meta, ...role("website"), configured: true } };
  }

  return {
    provider: demoWebsiteAnalysisProvider,
    status: {
      id: "demo",
      label: demoWebsiteAnalysisProvider.meta.label,
      ...role("website"),
      kind: "demo",
      configured: true,
    },
  };
}

function resolveAIProvider(): { provider: AIProvider; status: ProviderStatus } {
  const id = serverEnv.aiProvider;

  if (id === "openai") {
    if (!serverEnv.aiApiKey) {
      return {
        provider: demoAIProvider,
        status: {
          id: "demo",
          label: demoAIProvider.meta.label,
          ...role("ai"),
          kind: "demo",
          configured: false,
          reason: "AI_PROVIDER is set to openai but AI_API_KEY is missing, so demo analysis is being served.",
        },
      };
    }
    const provider = createOpenAIProvider(serverEnv.aiApiKey, serverEnv.aiModel);
    return { provider, status: { ...provider.meta, ...role("ai"), configured: true } };
  }

  return {
    provider: demoAIProvider,
    status: { id: "demo", label: demoAIProvider.meta.label, ...role("ai"), kind: "demo", configured: true },
  };
}

let cachedBusiness: { provider: BusinessSearchProvider; status: ProviderStatus } | null = null;
let cachedWebsite: { provider: WebsiteAnalysisProvider; status: ProviderStatus } | null = null;
let cachedAI: { provider: AIProvider; status: ProviderStatus } | null = null;

export function getBusinessProvider() {
  cachedBusiness ??= resolveBusinessProvider();
  return cachedBusiness;
}

export function getWebsiteProvider() {
  cachedWebsite ??= resolveWebsiteProvider();
  return cachedWebsite;
}

export function getAIProvider() {
  cachedAI ??= resolveAIProvider();
  return cachedAI;
}

export function getProviderStatuses(): ProviderStatus[] {
  return [
    getBusinessProvider().status,
    getWebsiteProvider().status,
    getAIProvider().status,
  ];
}

/** Throw a consistent, user-readable error when a capability is unavailable. */
export function assertConfigured(configured: boolean, what: string, envKey: string) {
  if (!configured) throw providerNotConfigured(what, envKey);
}

export { AppError };
