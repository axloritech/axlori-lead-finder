"use client";

import { CircleAlert, Lightbulb, ListChecks, RefreshCw, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiBadge, AiSparkle } from "@/components/brand";
import { ImpactBadge, OpportunityBadge } from "@/components/status-badges";
import { InfoNote, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { AILeadInsight } from "@/lib/types";

/**
 * AI Insights card.
 *
 * Structure mirrors how the insight was produced: what we know → what that might
 * mean → what's missing. Each opportunity cites the observable fact it is based on,
 * so a user can sanity-check the reasoning before acting on it.
 */
export function AIInsightCard({
  insight,
  loading = false,
  onRefresh,
  compact = false,
  className,
}: {
  insight: AILeadInsight | null;
  loading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
}) {
  if (loading) return <AIInsightSkeleton className={className} />;

  if (!insight) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-ink-300 bg-white p-5 text-center", className)}>
        <AiSparkle className="mx-auto" size={20} />
        <p className="mt-2 text-[13px] font-medium text-ink-700">AI insight not generated yet</p>
        <p className="mt-1 text-xs text-ink-500">
          Generate an analysis to see a summary, potential opportunities and suggested outreach.
        </p>
        {onRefresh ? (
          <Button variant="soft" size="sm" className="mt-3" onClick={onRefresh}>
            <Sparkles />
            Generate insight
          </Button>
        ) : null}
      </div>
    );
  }

  const unavailable = insight.model === "unavailable";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[18px] border border-ink-200 bg-white shadow-[var(--shadow-card)]",
        className,
      )}
      aria-label="AI lead insights"
    >
      <header className="flex items-start justify-between gap-3 border-b border-ink-100 bg-[linear-gradient(135deg,var(--color-sun-50),white_65%)] px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-sun-200 bg-white">
            <AiSparkle size={16} className="animate-[sparkle_2.8s_ease-in-out_infinite]" />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink-900">
              AI Insights
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-ink-500">
              {insight.mode === "demo" ? "Demo analyst" : insight.model} ·{" "}
              {formatRelativeTime(insight.generatedAt) ?? "just now"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!unavailable ? <OpportunityBadge score={insight.opportunityScore} /> : null}
          {onRefresh ? (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onRefresh}
              aria-label="Regenerate AI insight"
              title="Regenerate"
            >
              <RefreshCw />
            </Button>
          ) : null}
        </div>
      </header>

      <div className={cn("space-y-4 px-4 py-4", compact && "space-y-3 py-3.5")}>
        <p className="text-[14px] leading-relaxed text-ink-700">{insight.summary}</p>

        {insight.observations.length ? (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-500">
              <ListChecks className="size-3.5" aria-hidden />
              What the data shows
            </h3>
            <ul className="space-y-1.5">
              {insight.observations.map((observation) => (
                <li key={observation} className="flex gap-2 text-[13px] leading-relaxed text-ink-600">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-300" />
                  <span>{observation}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {insight.opportunities.length ? (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-500">
              <Target className="size-3.5" aria-hidden />
              Potential opportunities
            </h3>
            <ul className="space-y-2.5">
              {insight.opportunities.map((opportunity) => (
                <li
                  key={opportunity.title}
                  className="rounded-2xl border border-ink-200 bg-ink-50/60 px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-800">
                      <Lightbulb className="size-3.5 shrink-0 text-sun-500" aria-hidden />
                      {opportunity.title}
                    </p>
                    <ImpactBadge impact={opportunity.impact} />
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{opportunity.detail}</p>
                  <p className="mt-2 text-[11px] italic text-ink-400">Based on: {opportunity.basedOn}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : unavailable ? (
          <InfoNote tone="warning" icon={<CircleAlert className="size-4" />} title="AI analysis unavailable">
            {insight.dataGaps[0] ?? "The AI provider could not be reached. Business data is still shown above."}
          </InfoNote>
        ) : null}

        {insight.dataGaps.length && !unavailable ? (
          <div className="rounded-2xl border border-dashed border-ink-300 px-3.5 py-3">
            <p className="text-[12px] font-semibold text-ink-600">Data gaps</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{insight.dataGaps.join(" · ")}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3">
          <div className="flex items-center gap-2">
            <AiBadge label={insight.mode === "demo" ? "AI · demo" : "AI"} />
            <Badge variant="neutral" size="sm">
              Confidence: {insight.confidence}
            </Badge>
          </div>
          <p className="text-[11px] text-ink-400">{insight.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}

export function AIInsightSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[18px] border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]", className)}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[78%]" />
      </div>
      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
        <Sparkles className="size-3.5 animate-pulse text-sun-500" aria-hidden />
        Analysing online presence…
      </p>
    </div>
  );
}
