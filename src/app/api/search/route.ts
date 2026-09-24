import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, type ApiEnvelope } from "@/lib";
import { businessSearchService } from "@/lib/services";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";

const filterSchema = z.object({
  websiteStatus: z.array(z.enum(["has_website", "no_website", "unknown_website_status"])).default([]),
  contact: z.array(z.enum(["phone", "email", "whatsapp"])).default([]),
  minRating: z.number().min(0).max(5).nullable().default(null),
  maxDistanceMiles: z.number().min(0).max(500).nullable().default(null),
  categories: z.array(z.string()).default([]),
});

const searchSchema = z.object({
  term: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  radiusMiles: z.number().min(1).max(200).default(25),
  sort: z
    .enum(["relevance", "distance", "rating", "newest", "website_opportunity"])
    .default("relevance"),
  page: z.number().int().min(1).max(50).default(1),
  pageSize: z.number().int().min(1).max(100).default(24),
  filters: filterSchema.optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const body: ApiEnvelope<never> = {
      ok: false,
      error: { code: "invalid_query", message: "The request body must be valid JSON." },
    };
    return NextResponse.json(body, { status: 400 });
  }

  const parsed = searchSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = String(first?.path?.[0] ?? "");
    const isLocation = field === "location";
    const isTerm = field === "term";

    const body: ApiEnvelope<never> = {
      ok: false,
      error: {
        code: isLocation ? "invalid_location" : "invalid_query",
        message: isTerm
          ? "Enter a business type with at least 2 characters, for example “Barber shop”."
          : isLocation
            ? "Enter a location with at least 2 characters, for example “Columbus, Ohio”."
            : `“${field || "query"}” was not valid for this search.`,
        hint: isTerm || isLocation ? undefined : first?.message,
      },
    };
    return NextResponse.json(body, { status: 422 });
  }

  try {
    const data = await businessSearchService.search(parsed.data);
    const body: ApiEnvelope<SearchResponse> = { ok: true, data };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof AppError) {
      const body: ApiEnvelope<never> = { ok: false, error: error.toShape() };
      const status = error.code === "provider_not_configured" ? 503 : error.code === "rate_limited" ? 429 : 400;
      return NextResponse.json(body, { status });
    }
    const body: ApiEnvelope<never> = {
      ok: false,
      error: {
        code: "unknown",
        message: "Something went wrong while searching.",
        hint: error instanceof Error ? error.message : undefined,
      },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
