"use client";

import { SearchX } from "lucide-react";
import { BusinessCard } from "@/components/business-card";
import { BusinessCardSkeleton, EmptyState } from "@/components/ui/states";
import type { AILeadInsight, Business, CheckStatus, OutreachChannel } from "@/lib/types";

export interface BusinessListProps {
  businesses: Business[];
  loading?: boolean;
  /** Website-check status keyed by business id (from the search summary). */
  websiteChecks?: Map<string, CheckStatus>;
  insights?: Map<string, AILeadInsight>;
  savedIds?: Set<string>;
  onSaveToggle?: (business: Business) => void;
  onContact?: (business: Business, channel: OutreachChannel) => void;
  /** Copy shown in the empty state. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  skeletonCount?: number;
  className?: string;
}

export function BusinessList({
  businesses,
  loading = false,
  websiteChecks,
  insights,
  savedIds,
  onSaveToggle,
  onContact,
  emptyTitle = "No businesses found",
  emptyDescription = "Try a different business type, location, or search radius.",
  emptyAction,
  skeletonCount = 6,
  className,
}: BusinessListProps) {
  if (loading) {
    return (
      <div className={className} aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading businesses…</span>
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <BusinessCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!businesses.length) {
    return (
      <EmptyState
        icon={<SearchX />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <ul className="grid list-none gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {businesses.map((business) => (
          <li key={business.id} className="min-w-0">
            <BusinessCard
              business={business}
              websiteCheck={websiteChecks?.get(business.id) ?? null}
              insight={insights?.get(business.id) ?? null}
              saved={savedIds?.has(business.id) ?? false}
              onSaveToggle={onSaveToggle}
              onContact={onContact}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
