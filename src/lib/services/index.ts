/**
 * Service layer barrel.
 *
 * The UI imports from here (`@/lib/services`) and never from a provider directly,
 * which is what keeps vendor swaps and mock data out of the component tree.
 */
export { businessSearchService, normaliseQuery, DEFAULT_PAGE_SIZE } from "@/lib/services/business-search";
export { websiteAnalysisService } from "@/lib/services/website-analysis";
export { aiLeadAnalysisService } from "@/lib/services/ai-lead-analysis";
export { outreachService } from "@/lib/services/outreach";
export { getProviderStatuses, getRuntimeConfig, getProviderMetaSummary } from "@/lib/services/runtime";
