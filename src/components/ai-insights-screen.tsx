"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Globe, Search, Sparkles, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { BusinessAvatar } from "@/components/business-avatar";
import { Rating } from "@/components/rating";
import { GenerateOutreachButton } from "@/components/outreach-generator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, InfoNote, SearchProgress } from "@/components/ui/states";
import { AIInsightSkeleton } from "@/components/ai-insight-card";
import { WebsiteStatusBadge } from "@/components/status-badges";
import { AiSparkle } from "@/components/brand";
import { useApp } from "@/components/providers/app-provider";
import { api } from "@/lib/api-client";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { searchHref } from "@/lib/search-params";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AILeadInsight, Business, OutreachChannel, SearchResponse } from "@/lib/types";

/**
 * AIInsightsScreen.
 *
 * Ranks the current search by opportunity. The ranking itself is derived from the
 * business data (no website, review volume, contact availability) — the AI insight
 * then explains *why* each one is worth approaching. Nothing is asserted about a
 * business that the underlying data doesn't support.
 */
export function AIInsightsScreen() {
  const { lastSearch, saveLead, markContacted, leads } = useApp();
  const [insights, setInsights] = useState<Map<string, AILeadInsight>>(new Map());
  const [insightingIds, setInsightingIds] = useState<Set<string>>(new Set());
  const [reloadToken, setReloadToken] = useState(0);

  const key = `${lastSearch?.term ?? ""}::${lastSearch?.location ?? ""}::${lastSearch?.radiusMiles ?? ""}::${reloadToken}`;
  const resource = useAsyncResource<SearchResponse>(
    key,
    (signal) => api.search({ ...lastSearch, page: 1, pageSize: 12, sort: "website_opportunity" }, signal),
    { skip: !lastSearch?.term || !lastSearch?.location },
  );

  const response = resource.data;
  const loading = resource.status === "loading";
  const error = resource.error;

  const ranked = useMemo(() => {
    if (!response) return [];
    const weight = (b: Business) => {
      let score = 0;
      if (b.websiteStatus === "no_website") score += 40;
      if (b.websiteCheckPreview?.status === "needs_improvement") score += 26;
      if ((b.rating ?? 0) >= 4.5) score += 12;
      if ((b.reviewCount ?? 0) >= 50) score += 8;
      if (b.email) score += 5;
      if (b.phone) score += 4;
      return score;
    };
    return [...response.businesses].sort((a, b) => weight(b) - weight(a)).slice(0, 8);
  }, [response]);

  const generateInsight = async (business: Business) => {
    setInsightingIds((current) => new Set(current).add(business.id));
    try {
      const insight = await api.aiInsight(business.id);
      setInsights((current) => new Map(current).set(business.id, insight));
    } catch {
      // The card falls back to a data-derived explanation, so this is non-fatal.
    } finally {
      setInsightingIds((current) => {
        const next = new Set(current);
        next.delete(business.id);
        return next;
      });
    }
  };

  const savedIds = new Set(leads.map((lead) => lead.businessId));

  return (
    <>
      <PageHeader
        title="AI Insights"
        subtitle={
          lastSearch?.term
            ? `Opportunities in “${lastSearch.term}” · ${lastSearch.location}`
            : "Opportunities across your current search"
        }
      />

      <div className="mx-auto w-full max-w-[1000px] px-4 pt-4 lg:px-6 lg:pt-6">
        {!lastSearch?.term ? (
          <EmptyState
            icon={<Sparkles />}
            title="No search to analyse yet"
            description="Run a search first — AI Insights ranks those businesses by how likely they are to need web work."
            action={
              <Button asChild variant="primary">
                <Link href="/">
                  <Search />
                  Start a search
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
                    <AiSparkle size={16} />
                    Opportunity ranking
                  </h1>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                    Ordered by signals we can verify: no website published, website flagged for improvement, strong
                    review volume and reachable contact details.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReloadToken((token) => token + 1)}
                  loading={loading}
                >
                  {loading ? null : <TrendingUp />}
                  Refresh
                </Button>
              </div>

              {response ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="blue" size="sm">
                    {formatNumber(response.total)} businesses considered
                  </Badge>
                  <Badge variant="yellow" size="sm">
                    {formatNumber(response.summary.noWebsite)} without a website
                  </Badge>
                  <Badge variant="green" size="sm">
                    {formatNumber(response.summary.emailAvailable)} reachable by email
                  </Badge>
                </div>
              ) : null}
            </Card>

            {error ? (
              <ErrorState
                className="mt-4"
                message={error.message}
                hint={error.hint}
                onRetry={() => setReloadToken((token) => token + 1)}
              />
            ) : null}

            <div className="mt-4 space-y-3.5">
              {loading && !response ? (
                <>
                  <SearchProgress phase={2} />
                  <AIInsightSkeleton />
                  <AIInsightSkeleton />
                </>
              ) : null}
              {!loading || response
                ? ranked.map((business, index) => {
                    const insight = insights.get(business.id);
                    const pending = insightingIds.has(business.id);
                    return (
                      <Card key={business.id} className="overflow-hidden">
                        <div className="flex items-start gap-3.5 p-4">
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[12px] font-bold text-brand-700">
                            {index + 1}
                          </span>
                          <BusinessAvatar name={business.name} photoUrl={business.photoUrl} size={44} rounded="rounded-xl" />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h2 className="truncate text-[15px] font-semibold text-ink-900">
                                  <Link
                                    href={`/business/${encodeURIComponent(business.id)}`}
                                    className="hover:text-brand-700"
                                  >
                                    {business.name}
                                  </Link>
                                </h2>
                                <p className="truncate text-[12.5px] text-ink-500">
                                  {business.category} · {[business.location.city, business.location.region].filter(Boolean).join(", ")}
                                </p>
                              </div>
                              {business.rating ? <Rating rating={business.rating} reviewCount={business.reviewCount} size="sm" /> : null}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <WebsiteStatusBadge status={business.websiteStatus} size="sm" />
                              {business.email ? (
                                <Badge variant="blue" size="sm">
                                  Email
                                </Badge>
                              ) : null}
                              {business.phone ? (
                                <Badge variant="blue" size="sm">
                                  Phone
                                </Badge>
                              ) : null}
                            </div>

                            <div
                              className={cn(
                                "mt-3 rounded-2xl border px-3.5 py-3",
                                insight ? "border-sun-200 bg-sun-50/70" : "border-ink-200 bg-ink-50/70",
                              )}
                            >
                              {insight ? (
                                <>
                                  <p className="text-[13px] leading-relaxed text-ink-700">{insight.summary}</p>
                                  {insight.opportunities[0] ? (
                                    <p className="mt-2 flex items-start gap-1.5 text-[12.5px] font-medium text-sun-600">
                                      <Target className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                      {insight.opportunities[0].title} — {insight.opportunities[0].basedOn}
                                    </p>
                                  ) : null}
                                </>
                              ) : (
                                <p className="text-[13px] leading-relaxed text-ink-600">
                                  {business.websiteStatus === "no_website"
                                    ? "No website is published, which is the strongest signal of web work in this search."
                                    : business.websiteCheckPreview?.note ||
                                      "Website status has not been reviewed for this business yet."}
                                  {business.email
                                    ? " A public email address is available for outreach."
                                    : " No public email address was returned, so phone or walk-in may be the only route."}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {insight ? (
                                <GenerateOutreachButton
                                  business={business}
                                  label="Generate outreach"
                                  onUsed={(channel: OutreachChannel) => {
                                    if (!savedIds.has(business.id)) saveLead(business);
                                    markContacted(business.id, channel);
                                  }}
                                />
                              ) : (
                                <Button
                                  variant="soft"
                                  size="sm"
                                  onClick={() => void generateInsight(business)}
                                  loading={pending}
                                >
                                  {pending ? null : <Sparkles />}
                                  Generate AI insight
                                </Button>
                              )}
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/business/${encodeURIComponent(business.id)}`}>
                                  <Globe />
                                  View profile
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                : null}
            </div>

            {ranked.length ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="secondary" className="sm:flex-1">
                  <Link
                    href={searchHref({
                      term: lastSearch.term,
                      location: lastSearch.location,
                      radiusMiles: lastSearch.radiusMiles,
                      sort: "website_opportunity",
                    })}
                  >
                    <Search />
                    See full opportunity-sorted results
                  </Link>
                </Button>
                <InfoNote className="sm:flex-1" tone="info">
                  Rankings use provider data plus website checks. AI text is labelled separately.
                </InfoNote>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
