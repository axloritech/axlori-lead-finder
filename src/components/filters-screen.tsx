"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { FilterPanel, SortSelect } from "@/components/filter-panel";
import { useApp } from "@/components/providers/app-provider";
import { EMPTY_FILTERS } from "@/lib/constants";
import { api } from "@/lib/api-client";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { searchHref } from "@/lib/search-params";
import { pluralize } from "@/lib/format";
import type { FilterFacets, SearchFilters, SearchResponse, SortKey } from "@/lib/types";

/**
 * FiltersScreen — the dedicated mobile filters experience.
 *
 * Edits are held locally until "Apply filters" so the user can combine several
 * choices without triggering a request per tap.
 */
export function FiltersScreen() {
  const router = useRouter();
  const { lastSearch } = useApp();

  const [filters, setFilters] = useState<SearchFilters>(lastSearch?.filters ?? { ...EMPTY_FILTERS });
  const [sort, setSort] = useState<SortKey>(lastSearch?.sort ?? "relevance");

  // Facets describe the whole result set, so they are always fetched unfiltered.
  const facetsKey = `${lastSearch?.term ?? ""}::${lastSearch?.location ?? ""}::${lastSearch?.radiusMiles ?? ""}`;
  const facetsResource = useAsyncResource<SearchResponse>(
    facetsKey,
    (signal) => api.search({ ...lastSearch, filters: { ...EMPTY_FILTERS }, page: 1, pageSize: 1 }, signal),
    { skip: !lastSearch?.term || !lastSearch?.location },
  );

  const facets: FilterFacets | null = facetsResource.data?.facets ?? null;
  const resultCount = facetsResource.data?.total;
  const loadingFacets = facetsResource.status === "loading";

  if (!lastSearch?.term) {
    return (
      <>
        <PageHeader title="Filters" showBack />
        <div className="mx-auto w-full max-w-[700px] px-4 pt-4">
          <EmptyState
            icon={<SlidersHorizontal />}
            title="Filters need a search"
            description="Run a search for a business type and location, then come back to refine the results."
            action={
              <Button variant="primary" onClick={() => router.push("/")}>
                Start a search
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const apply = () => {
    router.push(
      searchHref({
        term: lastSearch.term,
        location: lastSearch.location,
        radiusMiles: lastSearch.radiusMiles,
        sort,
        page: 1,
        filters,
      }),
    );
  };

  return (
    <>
      <PageHeader title="Filters" subtitle={`${lastSearch.term} · ${lastSearch.location}`} showBack />

      <div className="mx-auto w-full max-w-[700px] px-4 pt-4">
        <div className="mb-3">
          <p className="mb-1.5 text-[13px] font-medium text-ink-700">Sort results by</p>
          <SortSelect value={sort} onChange={setSort} />
        </div>

        <FilterPanel
          filters={filters}
          facets={facets}
          onChange={setFilters}
          resultCount={resultCount}
          stickyFooter={
            <div className="space-y-2">
              <Button variant="cta" size="lg" block onClick={apply}>
                Apply filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                block
                onClick={() => {
                  setFilters({ ...EMPTY_FILTERS });
                  setSort("relevance");
                }}
              >
                <RotateCcw />
                Clear all
              </Button>
            </div>
          }
        />

        <p className="mt-3 text-center text-[12px] text-ink-400">
          {loadingFacets
            ? "Loading available filter options…"
            : resultCount !== undefined
              ? `${resultCount} ${pluralize(resultCount, "business", "businesses")} match your search before filters`
              : "Filter options come from the current search results"}
        </p>
      </div>
    </>
  );
}
