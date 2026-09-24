"use client";

import { CheckCircle2, CircleDashed, Globe, Info, MinusCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckStatusBadge } from "@/components/status-badges";
import { InfoNote } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { formatRelativeTime, hostnameOf } from "@/lib/format";
import type { CheckStatus, WebsiteAnalysis } from "@/lib/types";

/**
 * Website Analysis panel.
 *
 * Deliberately separates what was **observed** from what was **not checked**. The
 * measurement note at the bottom states how the result was produced so nobody
 * mistakes a heuristic for a live audit — and every status uses Good / Needs
 * Improvement / Unknown / Not Checked rather than inventing a score.
 */

const STATUS_ICON: Record<CheckStatus, React.ReactNode> = {
  good: <CheckCircle2 className="size-4 text-leaf-500" />,
  needs_improvement: <TriangleAlert className="size-4 text-sun-500" />,
  unknown: <CircleDashed className="size-4 text-ink-400" />,
  not_checked: <MinusCircle className="size-4 text-ink-300" />,
};

export function WebsiteStatusSummary({
  analysis,
  className,
}: {
  analysis: WebsiteAnalysis;
  className?: string;
}) {
  const host = hostnameOf(analysis.url);
  const statusLabel =
    analysis.status === "good"
      ? "Good"
      : analysis.status === "needs_improvement"
        ? "Needs Improvement"
        : analysis.status === "unknown"
          ? "Unknown"
          : "Not Checked";

  const tone =
    analysis.status === "good"
      ? "border-leaf-200 bg-leaf-50"
      : analysis.status === "needs_improvement"
        ? "border-sun-200 bg-sun-50"
        : "border-ink-200 bg-white";

  return (
    <div className={cn("rounded-2xl border p-4", tone, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Website status</p>
          <p className="mt-1 truncate text-[15px] font-semibold text-ink-900">
            {analysis.url ? "Has Website" : "No Website"}
          </p>
          {host ? <p className="mt-0.5 truncate text-xs text-ink-500">{host}</p> : null}
        </div>
        <Badge
          variant={analysis.status === "good" ? "green" : analysis.status === "needs_improvement" ? "yellow" : "neutral"}
        >
          {statusLabel}
        </Badge>
      </div>

      {analysis.observations.length ? (
        <ul className="mt-3 space-y-1.5">
          {analysis.observations.slice(0, 3).map((observation) => (
            <li key={observation} className="flex gap-2 text-[13px] leading-relaxed text-ink-600">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-300" />
              <span>{observation}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-400">
        <Info className="size-3" aria-hidden />
        {analysis.measurement.mode === "none"
          ? "Not reviewed"
          : `Last checked ${formatRelativeTime(analysis.checkedAt) ?? "recently"}`}
      </p>
    </div>
  );
}

export function WebsiteChecklist({
  analysis,
  className,
}: {
  analysis: WebsiteAnalysis;
  className?: string;
}) {
  if (!analysis.checks.length) {
    return (
      <p className={cn("rounded-2xl border border-dashed border-ink-300 bg-white px-4 py-5 text-[13px] text-ink-500", className)}>
        No website checks are available for this business. {analysis.measurement.note}
      </p>
    );
  }

  return (
    <ul className={cn("divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-white", className)}>
      {analysis.checks.map((check) => (
        <li key={check.id} className="flex items-start gap-3 px-4 py-3">
          <span className="mt-0.5 shrink-0">{STATUS_ICON[check.status]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13.5px] font-medium text-ink-800">{check.label}</p>
              <CheckStatusBadge status={check.status} />
            </div>
            {check.detail ? (
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{check.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function WebsiteAnalysisPanel({
  analysis,
  businessName,
  onRecheck,
  checking = false,
  className,
}: {
  analysis: WebsiteAnalysis;
  businessName: string;
  onRecheck?: () => void;
  checking?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)} aria-label={`Website analysis for ${businessName}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-brand-500" aria-hidden />
          <h2 className="text-[15px] font-semibold text-ink-900">Website analysis</h2>
        </div>
        {onRecheck ? (
          <Button variant="ghost" size="sm" onClick={onRecheck} loading={checking}>
            {checking ? null : <RefreshCw />}
            Re-check
          </Button>
        ) : null}
      </div>

      <WebsiteChecklist analysis={analysis} />

      <InfoNote tone={analysis.measurement.mode === "live" ? "info" : "warning"} title="How this was produced">
        {analysis.measurement.note}
      </InfoNote>
    </section>
  );
}
