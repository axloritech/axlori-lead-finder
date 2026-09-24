import { notFound } from "next/navigation";
import { BusinessDetail } from "@/components/business-detail";
import { businessSearchService, websiteAnalysisService, aiLeadAnalysisService } from "@/lib/services";

export const dynamic = "force-dynamic";

/**
 * /business/[id] — the business profile.
 *
 * Analysis and insight are resolved on the server (so provider keys stay server-side)
 * and pass through services that degrade one section at a time: a missing website or
 * an unavailable AI provider never takes the whole page down.
 */
export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await businessSearchService.getById(decodeURIComponent(id));
  if (!business) notFound();

  const analysis = await websiteAnalysisService.analyse(business);
  const insight = await aiLeadAnalysisService.analyse(business, analysis);

  return <BusinessDetail business={business} analysis={analysis} insight={insight} />;
}
