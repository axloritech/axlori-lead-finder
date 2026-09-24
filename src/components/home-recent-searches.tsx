"use client";

import Link from "next/link";
import { Clock, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers/app-provider";
import { searchHref } from "@/lib/search-params";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Recent searches, so returning users resume in one tap. Hidden when empty. */
export function HomeRecentSearches({ className }: { className?: string }) {
  const { history, clearHistory } = useApp();

  if (!history.length) return null;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink-900">
          <Clock className="size-4 text-brand-500" aria-hidden />
          Recent searches
        </h2>
        <Button variant="ghost" size="sm" onClick={clearHistory}>
          <Trash2 />
          Clear
        </Button>
      </div>
      <ul className="mt-2.5 divide-y divide-ink-100">
        {history.slice(0, 4).map((entry) => (
          <li key={entry.id}>
            <Link
              href={searchHref({
                term: entry.term,
                location: entry.location,
                radiusMiles: entry.radiusMiles,
              })}
              className="flex items-center gap-3 py-2.5 transition-colors hover:bg-ink-50/70"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
                <TrendingUp className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-ink-800">{entry.term}</span>
                <span className="block truncate text-[12px] text-ink-500">
                  {entry.location} · {entry.radiusMiles} mi
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[12px] font-semibold tabular-nums text-brand-600">
                  {entry.resultCount}
                </span>
                <span className="block text-[11px] text-ink-400">
                  {formatRelativeTime(entry.at) ?? "recently"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
