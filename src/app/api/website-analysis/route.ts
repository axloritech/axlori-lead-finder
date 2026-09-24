import { NextResponse } from "next/server";
import { z } from "zod";
import { type ApiEnvelope } from "@/lib";
import { businessSearchService, websiteAnalysisService } from "@/lib/services";

export const runtime = "nodejs";

const schema = z.object({
  businessId: z.string().min(1),
  force: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const body: ApiEnvelope<never> = {
      ok: false,
      error: { code: "invalid_query", message: "A businessId is required." },
    };
    return NextResponse.json(body, { status: 422 });
  }

  const business = await businessSearchService.getById(parsed.data.businessId);
  if (!business) {
    const body: ApiEnvelope<never> = {
      ok: false,
      error: { code: "no_results", message: "That business could not be found." },
    };
    return NextResponse.json(body, { status: 404 });
  }

  // Returns a structured result even when the analysis provider is unavailable.
  const data = await websiteAnalysisService.analyse(business, { force: parsed.data.force });
  const body: ApiEnvelope<typeof data> = { ok: true, data };
  return NextResponse.json(body);
}
