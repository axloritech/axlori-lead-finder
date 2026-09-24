"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpDown,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { BusinessList } from "@/components/business-list";
import { BusinessStats } from "@/components/business-stats";
import { FilterPanel, SortSelect } from "@/components/filter-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, InfoNote, SearchProgress } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api-client";
import { EMPTY_FILTERS } from "@/lib/constants";
import { filtersActiveCount, searchHref } from "@/lib/search-params";
import { formatNumber, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Business, CheckStatus, OutreachChannel, SearchQuery, SearchResponse, SortKey } from "@/lib/types";

/**
 * FindResults — the results experience.
 *
 * The first page is rendered on the server (fast initial paint, no loading flash),
 * and the URL is the single source of truth for filters, sorting and paging. Filter
 * and sort changes push a new URL inside a transition so the previous results stay
 * on screen while the next ones resolve.
 */
export interface FindResultsProps {
  initialQuery: Partial<SearchQuery> & { term: string; location: string };
  initialData: SearchResponse | null;
  initialError?: { code: string; message: string; hint?: string } | null;
}

export function FindResults({ initialQuery, initialData, initialError = null }: FindResultsProps) {
  const router = useRouter();
  const { leads, isSaved, toggleLead, markContacted } = useApp();
  const [isPending, startTransition] = useTransition();

  const [response, setResponse] = useState<SearchResponse | null>(initialData);
  const [extraPages, setExtraPages] = useState<Business[]>([]);
  const [loadMoreError, setLoadMoreError] = useState<ApiError | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  /** Drives the "Searching businesses…" progress copy while a filter change resolves. */
  const [pendingPhase, setPendingPhase] = useState(0);

  const filters = initialQuery.filters ?? EMPTY_FILTERS;
  const activeFilters = filtersActiveCount(filters);
  const savedIds = useMemo(() => new Set(leads.map((lead) => lead.businessId)), [leads]);

  const businesses = useMemo(() => {
    if (!response) return [];
    if (!extraPages.length) return response.businesses;
    const seen = new Set<string>();
    return [...response.businesses, ...extraPages].filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [response, extraPages]);

  const websiteChecks = useMemo(() => {
    const map = new Map<string, CheckStatus>();
    businesses.forEach((b) => {
      if (b.websiteCheckPreview?.status) map.set(b.id, b.websiteCheckPreview.status);
    });
    return map;
  }, [businesses]);

  const pushQuery = (patch: Partial<SearchQuery>) => {
    setPendingPhase(1);
    const phaseTimer = setTimeout(() => setPendingPhase(2), 700);
    const next: Partial<SearchQuery> = {
      term: initialQuery.term,
      location: initialQuery.location,
      radiusMiles: initialQuery.radiusMiles,
      sort: initialQuery.sort,
      filters,
      page: 1,
      ...patch,
    };
    startTransition(() => {
      router.push(searchHref(next), { scroll: false });
      clearTimeout(phaseTimer);
      setPendingPhase(0);
    });
  };

  const loadMore = async () => {
    const nextPage = (initialQuery.page ?? 1) + 1;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const data = await api.search({ ...initialQuery, page: nextPage, pageSize: 24 });
      setExtraPages((current) => [...current, ...data.businesses]);
      if (!response) setResponse(data);
    } catch (error) {
      setLoadMoreError(
        error instanceof ApiError ? error : new ApiError({ code: "unknown", message: "Could not load more results." }, 0),
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleContact = (business: Business, channel: OutreachChannel) => {
    if (isSaved(business.id)) markContacted(business.id, channel);
  };

  const total = response?.total ?? 0;
  const error = initialError;

  return (
    <>
      <PageHeader
        showBack
        title={`Results${response ? ` (${formatNumber(total)})` : ""}`}
        subtitle={`${initialQuery.term} · ${initialQuery.location}`}
        actions={
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/">
              <Pencil />
              New search
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 lg:px-6 lg:pt-6">
        {/* ---------- desktop query summary + sort ---------- */}
        <div className="hidden items-center gap-3 lg:flex">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-ink-900">
              {formatNumber(total)} {pluralize(total, "business", "businesses")} found
            </h1>
            <p className="truncate text-[13px] text-ink-500">
              {initialQuery.term} within {initialQuery.radiusMiles} miles of {initialQuery.location}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500">
              <ArrowUpDown className="size-3.5" aria-hidden />
              Sort
            </span>
            <SortSelect
              value={(initialQuery.sort ?? "relevance") as SortKey}
              onChange={(sort) => pushQuery({ sort })}
              className="w-[210px]"
            />
          </div>
        </div>

        {/* ---------- mobile sort + filter row ---------- */}
        <div className="flex items-center gap-2 lg:hidden">
          <SortSelect
            value={(initialQuery.sort ?? "relevance") as SortKey}
            onChange={(sort) => pushQuery({ sort })}
            size="sm"
            className="flex-1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMobileFilters((v) => !v)}
            aria-expanded={showMobileFilters}
          >
            <SlidersHorizontal />
            Filters
            {activeFilters ? (
              <span className="ml-0.5 rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            ) : null}
          </Button>
        </div>

        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
          <div className="min-w-0">
            <div
              className={cn(
                "transition-opacity duration-200",
                isPending && "pointer-events-none opacity-60",
              )}
              aria-busy={isPending || undefined}
            >
              {isPending ? <SearchProgress phase={pendingPhase} className="mb-3" /> : null}
              {error ? (
                <InfoNote tone="warning" title="Search could not be completed">
                  {error.message} {error.hint ?? ""}
                </InfoNote>
              ) : null}

              {response ? (
                <>
                  <BusinessStats summary={response.summary} />

                  {response.isDemoData ? (
                    <InfoNote tone="warning" className="mt-3" title="Demo data">
                      {response.notices[0]}
                    </InfoNote>
                  ) : null}
                </>
              ) : null}

              {showMobileFilters ? (
                <FilterPanel
                  className="mt-3 lg:hidden"
                  filters={filters}
                  facets={response?.facets}
                  resultCount={response?.total}
                  onChange={(next) => pushQuery({ filters: next })}
                />
              ) : null}

              {!response && error ? (
                <EmptyState
                  className="mt-4"
                  icon={<Search />}
                  title="Nothing to show"
                  description="Adjust your search and try again."
                  action={
                    <Button asChild variant="primary">
                      <Link href="/">
                        <Search />
                        New search
                      </Link>
                    </Button>
                  }
                />
              ) : businesses.length ? (
                <>
                  <div className="mb-3 mt-4 flex items-center justify-between gap-3 lg:hidden">
                    <p className="text-[13px] font-semibold text-ink-700">
                      {formatNumber(total)} {pluralize(total, "result")}
                    </p>
                    <span className="text-[12px] text-ink-400">Showing {businesses.length}</span>
                  </div>

                  <BusinessList
                    className="mt-2 lg:mt-4"
                    businesses={businesses}
                    websiteChecks={websiteChecks}
                    savedIds={savedIds}
                    onSaveToggle={(business) => toggleLead(business)}
                    onContact={handleContact}
                  />

                  <div className="mt-4 flex flex-col items-center gap-2">
                    {response?.hasMore ? (
                      <Button
                        variant="secondary"
                        size="lg"
                        loading={loadingMore}
                        onClick={() => void loadMore()}
                        className="w-full sm:w-auto"
                      >
                        {loadingMore ? null : <RefreshCw />}
                        Load more businesses
                      </Button>
                    ) : (
                      <p className="text-[12.5px] text-ink-400">
                        That’s all {formatNumber(businesses.length)} results for this search.
                      </p>
                    )}
                    {loadMoreError ? (
                      <p className="text-[12.5px] text-red-600">{loadMoreError.message}</p>
                    ) : null}
                  </div>

                  <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-ink-400">
                    <Store className="size-3.5" aria-hidden />
                    Save any business to track it in your Leads, then generate outreach from there.
                  </p>
                </>
              ) : (
                <div className="mt-4">
                  <BusinessList
                    businesses={[]}
                    emptyTitle="No businesses found"
                    emptyDescription="Try a different business type, location, or search radius."
                    emptyAction={
                      <>
                        <Button asChild variant="primary">
                          <Link href="/">
                            <Search />
                            New search
                          </Link>
                        </Button>
                        {activeFilters ? (
                          <Button variant="secondary" onClick={() => pushQuery({ filters: { ...EMPTY_FILTERS } })}>
                            Clear {activeFilters} {pluralize(activeFilters, "filter")}
                          </Button>
                        ) : null}
                      </>
                    }
                  />
                  {response && response.unfilteredTotal > 0 ? (
                    <InfoNote className="mt-3" tone="info">
                      {formatNumber(response.unfilteredTotal)} businesses matched your search before filters were
                      applied.
                    </InfoNote>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* ---------- desktop filters + search context ---------- */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <FilterPanel
                filters={filters}
                facets={response?.facets}
                resultCount={response?.total}
                onChange={(next) => pushQuery({ filters: next })}
              />

              <div className="rounded-[18px] border border-ink-200 bg-white p-4">
                <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                  <MapPin className="size-4 text-brand-500" aria-hidden />
                  Search context
                </h2>
                <dl className="mt-2.5 space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-500">Business type</dt>
                    <dd className="truncate font-medium text-ink-800">{initialQuery.term}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-500">Location</dt>
                    <dd className="truncate font-medium text-ink-800">{initialQuery.location}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-500">Radius</dt>
                    <dd className="font-medium text-ink-800">{initialQuery.radiusMiles} miles</dd>
                  </div>
                </dl>
                {response ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="blue" size="sm">
                      {formatNumber(response.summary.phoneAvailable)} with phone
                    </Badge>
                    <Badge variant="blue" size="sm">
                      {formatNumber(response.summary.emailAvailable)} with email
                    </Badge>
                    <Badge variant="green" size="sm">
                      {formatNumber(response.summary.whatsappAvailable)} on WhatsApp
                    </Badge>
                  </div>
                ) : null}
                <Button asChild variant="soft" size="sm" className="mt-3 w-full">
                  <Link
                    href={searchHref({
                      ...initialQuery,
                      filters: { ...EMPTY_FILTERS, websiteStatus: ["no_website"] },
                    })}
                  >
                    <AlertTriangle />
                    Show only no-website leads
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
