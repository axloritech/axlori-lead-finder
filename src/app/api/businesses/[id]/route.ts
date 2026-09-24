import { NextResponse } from "next/server";
import { type ApiEnvelope } from "@/lib";
import { businessSearchService } from "@/lib/services";
import type { Business, WebsiteAnalysis } from "@/lib/types";
import { aiLeadAnalysisService, websiteAnalysisService } from "@/lib/services";

export const runtime = "nodejs";

interface DossierResponse {
  business: Business;
  analysis: WebsiteAnalysis;
  insight: Awaited<ReturnType<typeof aiLeadAnalysisService.analyse>>;
}

/**
 * Full dossier for one business. Every sub-step is individually fault-tolerant:
 * a missing website or a failed AI call degrades that section, never the page.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  const business = await businessSearchService.getById(id);
  if (!business) {
    const body: ApiEnvelope<never> = {
      ok: false,
      error: {
        code: "no_results",
        message: "That business could not be found.",
        hint: "It may have been removed by the data provider, or the link may be incomplete.",
      },
    };
    return NextResponse.json(body, { status: 404 });
  }

  const analysis = await websiteAnalysisService.analyse(business, { force });
  const insight = await aiLeadAnalysisService.analyse(business, analysis, { force });

  const body: ApiEnvelope<DossierResponse> = { ok: true, data: { business, analysis, insight } };
  return NextResponse.json(body);
}
