"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, Layers, Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DashboardStatGrid, StatCard } from "@/components/business-stats";
import { BusinessAvatar } from "@/components/business-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-provider";
import { computeStats } from "@/lib/leads";
import { api } from "@/lib/api-client";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SearchResponse } from "@/lib/types";

/**
 * BusinessSummary — statistics for the current search plus the live dashboard
 * counts. Numbers are always labelled with what they represent, and "needs
 * improvement" discloses how many websites were actually reviewed.
 */
export function BusinessSummaryScreen() {
  const { lastSearch, leads } = useApp();
  const [reloadToken, setReloadToken] = useState(0);
  const key = `${lastSearch?.term ?? ""}::${lastSearch?.location ?? ""}::${lastSearch?.radiusMiles ?? ""}::${reloadToken}`;

  const resource = useAsyncResource<SearchResponse>(
    key,
    (signal) => api.search({ ...lastSearch, page: 1, pageSize: 60 }, signal),
    { skip: !lastSearch?.term || !lastSearch?.location },
  );

  const response = resource.data;
  const loading = resource.status === "loading";
  const error = resource.error;

  const stats = computeStats({
    current: response ? { total: response.total, summary: response.summary } : null,
    leads,
  });

  const topCategories = response?.categoryBreakdown?.slice(0, 5) ?? [];
  const maxCount = topCategories[0]?.count ?? 1;

  return (
    <>
      <PageHeader
        title="Business Summary"
        subtitle={lastSearch?.term ? `${lastSearch.term} · ${lastSearch.location}` : "Statistics for your current search"}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 lg:px-6 lg:pt-6">
        {!lastSearch?.term ? (
          <EmptyState
            icon={<BarChart3 />}
            title="No search data yet"
            description="Run a search and this screen will summarise the businesses you found, their websites and your saved leads."
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
            {error ? (
              <ErrorState
                message={error.message}
                hint={error.hint}
                onRetry={() => setReloadToken((token) => token + 1)}
                className="mb-4"
              />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="min-w-0 space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h1 className="text-[15px] font-semibold text-ink-900">Businesses Found</h1>
                      <p className="mt-0.5 text-[13px] text-ink-500">
                        Across “{lastSearch.term}” within {lastSearch.radiusMiles ?? 25} miles
                      </p>
                    </div>
                    {response ? <Badge variant="blue">{formatNumber(response.total)}</Badge> : null}
                  </div>
                  {loading && !response ? (
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      <StatCard
                        item={{
                          key: "has",
                          label: "Has Website",
                          value: stats.withWebsites,
                          icon: <Building2 />,
                          tone: "green",
                        }}
                      />
                      <StatCard
                        item={{ key: "no", label: "No Website", value: stats.withoutWebsites, icon: <Building2 />, tone: "yellow" }}
                      />
                      <StatCard
                        item={{
                          key: "improve",
                          label: "Needs Improvement",
                          value: stats.needingImprovement,
                          icon: <Sparkles />,
                          tone: "yellow",
                          hint: response?.summary.analysedWebsites
                            ? `From ${response.summary.analysedWebsites} reviewed sites`
                            : "No sites reviewed yet",
                        }}
                      />
                    </div>
                  )}
                </Card>

                <Card className="p-4">
                  <h2 className="text-[15px] font-semibold text-ink-900">Your statistics</h2>
                  <p className="mt-0.5 text-[13px] text-ink-500">Search results combined with your saved leads.</p>
                  <DashboardStatGrid stats={stats} className="mt-3.5" />
                </Card>
              </div>

              <aside className="space-y-4">
                <Card className="p-4">
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
                    <Layers className="size-4 text-brand-500" aria-hidden />
                    Top Business Types
                  </h2>
                  {topCategories.length ? (
                    <ul className="mt-3 space-y-2.5">
                      {topCategories.map((item) => (
                        <li key={item.category}>
                          <div className="flex items-center justify-between gap-2 text-[13px]">
                            <span className="truncate font-medium text-ink-700">{item.category}</span>
                            <span className="tabular-nums text-ink-500">{formatNumber(item.count)}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                            <div
                              className={cn("h-full rounded-full bg-brand-500")}
                              style={{ width: `${Math.max(6, (item.count / maxCount) * 100)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[13px] text-ink-500">
                      The provider did not return a category breakdown for this search.
                    </p>
                  )}
                </Card>

                {response?.businesses?.length ? (
                  <Card className="p-4">
                    <h2 className="text-[15px] font-semibold text-ink-900">Top opportunity leads</h2>
                    <ul className="mt-3 space-y-2.5">
                      {response.businesses
                        .filter((b) => b.websiteStatus === "no_website")
                        .slice(0, 4)
                        .map((business) => (
                          <li key={business.id} className="flex items-center gap-3">
                            <BusinessAvatar name={business.name} photoUrl={business.photoUrl} size={36} rounded="rounded-xl" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-ink-800">{business.name}</p>
                              <p className="truncate text-[11.5px] text-ink-500">
                                No website · {business.location.city}
                              </p>
                            </div>
                            <Link
                              href={`/business/${encodeURIComponent(business.id)}`}
                              className="shrink-0 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                            >
                              View
                            </Link>
                          </li>
                        ))}
                      {!response.businesses.some((b) => b.websiteStatus === "no_website") ? (
                        <li className="text-[13px] text-ink-500">
                          Every business on this page has a website — try sorting by website opportunity.
                        </li>
                      ) : null}
                    </ul>
                  </Card>
                ) : null}

                <Button asChild variant="cta" block size="lg">
                  <Link href="/">
                    <Search />
                    New Search
                  </Link>
                </Button>
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}
