import type { AppErrorCode, AppErrorShape, DataSourceKind } from "@/lib/types";

/**
 * Server + client configuration.
 *
 * Secrets are read **only** on the server (`serverEnv`). The client learns about
 * provider state through `/api/health`, which reports labels and status but never
 * keys — nothing here is ever bundled into browser JavaScript.
 */

const readServerEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
};

export const serverEnv = {
  /** Business data provider: "demo" | "google_places" | … */
  businessProvider: readServerEnv("BUSINESS_DATA_PROVIDER") ?? "demo",
  businessProviderApiKey:
    readServerEnv("BUSINESS_DATA_API_KEY") ?? readServerEnv("GOOGLE_PLACES_API_KEY"),
  businessProviderBaseUrl: readServerEnv("BUSINESS_DATA_BASE_URL"),

  /** Website analysis provider: "demo" | "pagespeed" | "custom" */
  websiteProvider: readServerEnv("WEBSITE_ANALYSIS_PROVIDER") ?? "demo",
  websiteProviderApiKey:
    readServerEnv("WEBSITE_ANALYSIS_API_KEY") ?? readServerEnv("PAGESPEED_API_KEY"),

  /** AI provider: "demo" | "openai" | "anthropic" */
  aiProvider: readServerEnv("AI_PROVIDER") ?? "demo",
  aiApiKey: readServerEnv("AI_API_KEY") ?? readServerEnv("OPENAI_API_KEY"),
  aiModel: readServerEnv("AI_MODEL") ?? "gpt-4o-mini",
} as const;

export interface RuntimeConfig {
  businessProvider: string;
  businessProviderConfigured: boolean;
  websiteProvider: string;
  websiteProviderConfigured: boolean;
  aiProvider: string;
  aiProviderConfigured: boolean;
  aiModel: string;
  /** True when the business records in results come from a live provider. */
  businessDataLive: boolean;
  /** True when every capability is live. Any demo capability keeps this true. */
  demoMode: boolean;
}

/** Safe for both server and client: contains no credentials. */
export function getRuntimeConfig(): RuntimeConfig {
  const businessConfigured =
    serverEnv.businessProvider !== "demo" && Boolean(serverEnv.businessProviderApiKey);
  const websiteConfigured =
    serverEnv.websiteProvider !== "demo" && Boolean(serverEnv.websiteProviderApiKey);
  const aiConfigured = serverEnv.aiProvider !== "demo" && Boolean(serverEnv.aiApiKey);

  return {
    businessProvider: businessConfigured ? serverEnv.businessProvider : "demo",
    businessProviderConfigured: businessConfigured,
    websiteProvider: websiteConfigured ? serverEnv.websiteProvider : "demo",
    websiteProviderConfigured: websiteConfigured,
    aiProvider: aiConfigured ? serverEnv.aiProvider : "demo",
    aiProviderConfigured: aiConfigured,
    aiModel: serverEnv.aiModel,
    businessDataLive: businessConfigured,
    demoMode: !(businessConfigured && aiConfigured && websiteConfigured),
  };
}

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly hint?: string;

  constructor(code: AppErrorCode, message: string, hint?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.hint = hint;
  }

  toShape(): AppErrorShape {
    return { code: this.code, message: this.message, hint: this.hint };
  }
}

export const providerNotConfigured = (what: string, envKey: string) =>
  new AppError(
    "provider_not_configured",
    `${what} is not configured.`,
    `Add ${envKey} to your environment variables and restart the app to switch from demo data to live results.`,
  );

export const DEMO_NOTICE =
  "Demo mode: results are generated sample records, not real businesses.";

export function dataSourceKind(isDemo: boolean): DataSourceKind {
  return isDemo ? "demo" : "live";
}
