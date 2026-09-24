import * as React from "react";
import { AlertCircle, Info, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-lg", className)} aria-hidden {...props} />;
}

export function BusinessCardSkeleton() {
  return (
    <div className="rounded-[18px] border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex gap-3.5">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-6 w-14" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty / Error / Info                                                       */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[20px] border border-dashed border-ink-300 bg-white/70 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 [&_svg]:size-6">
        {icon ?? <Sparkles />}
      </span>
      <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-500">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  hint,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-[20px] border border-red-100 bg-red-50/60 px-5 py-6 text-center sm:text-left",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-red-500">
          <AlertCircle className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{message}</p>
          {hint ? (
            <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs leading-relaxed text-ink-500">{hint}</p>
          ) : null}
        </div>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry} className="shrink-0">
            <RefreshCw />
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function InfoNote({
  title,
  children,
  tone = "info",
  icon,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "info" | "warning" | "success";
  icon?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-brand-100 bg-brand-50/70 text-brand-800 [&_svg]:text-brand-500",
    warning: "border-sun-200 bg-sun-50 text-sun-600 [&_svg]:text-sun-500",
    success: "border-leaf-200 bg-leaf-50 text-leaf-700 [&_svg]:text-leaf-600",
  } as const;

  return (
    <div className={cn("flex gap-3 rounded-2xl border px-3.5 py-3", tones[tone], className)}>
      <span className="mt-0.5 shrink-0">{icon ?? <Info className="size-4" />}</span>
      <div className="min-w-0 text-[13px] leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn(title && "mt-0.5", "text-ink-600")}>{children}</div>
      </div>
    </div>
  );
}

/** Loading copy shown while a search runs — matches the three real phases. */
export const SEARCH_PHASES = [
  { label: "Searching businesses…", detail: "Querying the business-data provider" },
  { label: "Checking websites…", detail: "Reviewing public web presence" },
  { label: "Analyzing online presence…", detail: "Preparing lead insights" },
] as const;

export function SearchProgress({ phase, className }: { phase: number; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex size-9 items-center justify-center rounded-2xl bg-brand-50">
          <Sparkles className="size-4 animate-[sparkle_2.4s_ease-in-out_infinite] text-sun-500" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink-900">{SEARCH_PHASES[phase]?.label}</p>
          <p className="truncate text-xs text-ink-500">{SEARCH_PHASES[phase]?.detail}</p>
        </div>
      </div>
      <ol className="mt-3.5 space-y-2">
        {SEARCH_PHASES.map((step, index) => (
          <li key={step.label} className="flex items-center gap-2.5 text-[13px]">
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full border text-[9px] font-bold",
                index < phase
                  ? "border-leaf-500 bg-leaf-500 text-white"
                  : index === phase
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-ink-300 bg-white text-transparent",
              )}
            >
              {index < phase ? "✓" : "•"}
            </span>
            <span className={index <= phase ? "font-medium text-ink-700" : "text-ink-400"}>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
