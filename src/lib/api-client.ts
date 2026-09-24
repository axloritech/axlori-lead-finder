import type { ApiEnvelope, AppErrorShape } from "@/lib/types";
import type { AILeadInsight, Business, OutreachDraft, SearchQuery, SearchResponse, WebsiteAnalysis } from "@/lib/types";
import type { SenderProfile } from "@/lib/outreach/tokenise";
import type { OutreachTemplate } from "@/lib/types";

/** Client-side helper for the app's own API routes. Never touches provider keys. */

export class ApiError extends Error {
  readonly code: AppErrorShape["code"];
  readonly hint?: string;
  readonly status: number;

  constructor(error: AppErrorShape, status: number) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.hint = error.hint;
    this.status = status;
  }
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (error) {
    throw new ApiError(
      {
        code: "network",
        message: "You appear to be offline. Check your connection and try again.",
        hint: error instanceof Error ? error.message : undefined,
      },
      0,
    );
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!res.ok || !body?.ok) {
    throw new ApiError(
      body?.error ?? { code: "unknown", message: "The request failed." },
      res.status,
    );
  }
  return body.data as T;
}

export const api = {
  search(query: Partial<SearchQuery>, signal?: AbortSignal) {
    return request<SearchResponse>("/api/search", {
      signal,
      method: "POST",
      body: JSON.stringify({
        term: query.term,
        location: query.location,
        radiusMiles: query.radiusMiles,
        sort: query.sort,
        page: query.page,
        pageSize: query.pageSize,
        filters: query.filters,
      }),
    });
  },

  business(id: string, options?: { force?: boolean }) {
    const suffix = options?.force ? "?force=true" : "";
    return request<{ business: Business; analysis: WebsiteAnalysis; insight: AILeadInsight }>(
      `/api/businesses/${encodeURIComponent(id)}${suffix}`,
    );
  },

  analyseWebsite(businessId: string, force = false) {
    return request<WebsiteAnalysis>("/api/website-analysis", {
      method: "POST",
      body: JSON.stringify({ businessId, force }),
    });
  },

  aiInsight(businessId: string, options?: { force?: boolean; includeWebsite?: boolean }) {
    return request<AILeadInsight>("/api/ai/insights", {
      method: "POST",
      body: JSON.stringify({
        businessId,
        force: options?.force ?? false,
        includeWebsite: options?.includeWebsite ?? true,
      }),
    });
  },

  generateOutreach(input: {
    businessId: string;
    templateId: string;
    channel: "email" | "whatsapp";
    template?: OutreachTemplate;
    sender?: SenderProfile;
  }, signal?: AbortSignal) {
    return request<{ draft: OutreachDraft; degraded: boolean; reason?: string }>(
      "/api/outreach/generate",
      { method: "POST", body: JSON.stringify(input), signal },
    );
  },
};
