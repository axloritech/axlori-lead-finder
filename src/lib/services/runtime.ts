import { getRuntimeConfig, type RuntimeConfig } from "@/lib/config";
import { getProviderStatuses, type ProviderStatus } from "@/lib/providers";

/** Server-side runtime status used by the Settings screen and API routes. */
export function getProviderMetaSummary(): { config: RuntimeConfig; providers: ProviderStatus[] } {
  return { config: getRuntimeConfig(), providers: getProviderStatuses() };
}

export { getRuntimeConfig, getProviderStatuses };
export type { RuntimeConfig, ProviderStatus };
