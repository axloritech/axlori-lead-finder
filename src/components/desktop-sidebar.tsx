"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CircleAlert, Sparkles } from "lucide-react";
import { AxloriLogo, AiSparkle } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { PRIMARY_NAV, isActivePath } from "@/components/nav-config";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { ProviderRole } from "@/lib/providers";

/**
 * DesktopSidebar — primary navigation on large screens. Also carries the live
 * provider status, so users always know whether they are looking at demo data or
 * live vendor data without digging through settings.
 */
/** Plain-language names for each capability, used in status copy. */
const ROLE_LABELS: Record<ProviderRole, string> = {
  business: "business results",
  website: "website checks",
  ai: "AI analysis",
};

export function DesktopSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { leads, runtime, lastSearch } = useApp();

  // What matters to a user scanning results is where the *business records* came
  // from, so the badge tracks that provider specifically — not whether the AI and
  // website providers are also live.
  const businessProvider = runtime?.providers?.find((p) => p.role === "business");
  const resultsAreLive = businessProvider ? businessProvider.kind === "live" : false;
  const demoMode = !resultsAreLive;
  const demoCapabilities = (runtime?.providers ?? [])
    .filter((p) => p.kind === "demo" && p.role !== "business")
    .map((p) => ROLE_LABELS[p.role]);
  const uncontacted = leads.filter((lead) => !lead.lastContactedAt).length;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-ink-200 bg-white lg:flex",
        className,
      )}
    >
      <div className="px-4 py-5">
        <Link href="/" aria-label="Axlori Lead Finder home">
          <AxloriLogo />
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-2.5 pb-3">
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map((item) => {
            const active = isActivePath(pathname, item);
            const Icon = item.icon;
            const badge = item.href === "/saved" && leads.length ? leads.length : undefined;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                  )}
                >
                  <Icon className={cn("size-[18px] shrink-0", active ? "text-brand-600" : "text-ink-400")} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badge ? (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink-600">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-ink-100 p-3.5">
        {lastSearch?.term ? (
          <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Current search</p>
            <p className="mt-1 truncate text-[13px] font-semibold text-ink-800">{lastSearch.term}</p>
            <p className="truncate text-[12px] text-ink-500">{lastSearch.location}</p>
            <Link
              href="/find"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              View results
            </Link>
          </div>
        ) : null}

        {leads.length ? (
          <div className="flex items-center gap-2 rounded-2xl border border-ink-200 px-3 py-2.5">
            <Bookmark className="size-4 shrink-0 text-brand-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink-800">
                {formatNumber(leads.length)} saved {leads.length === 1 ? "lead" : "leads"}
              </p>
              <p className="truncate text-[11px] text-ink-500">
                {uncontacted ? `${uncontacted} not contacted yet` : "All contacted"}
              </p>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "rounded-2xl border p-3",
            demoMode ? "border-sun-200 bg-sun-50" : "border-leaf-200 bg-leaf-50",
          )}
        >
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-800">
            {demoMode ? <AiSparkle size={13} /> : <Sparkles className="size-3.5 text-leaf-600" />}
            {demoMode ? "Demo data" : "Live provider"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-600">
            {demoMode
              ? "Sample records are being used so you can explore the product."
              : `Results come from ${businessProvider?.label ?? "your configured provider"}.`}
          </p>
          {!demoMode && demoCapabilities.length ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-sun-600">
              Still on demo: {demoCapabilities.join(" and ")}.
            </p>
          ) : null}
          <Button asChild variant="secondary" size="sm" className="mt-2 w-full">
            <Link href="/settings">Data sources</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

/** Compact status strip for the tablet layout (sidebar collapsed to icons). */
export function TabletNavStrip({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className={cn("scrollbar-none flex items-center gap-1 overflow-x-auto border-b border-ink-200 bg-white px-3 py-2", className)}
    >
      {PRIMARY_NAV.map((item) => {
        const active = isActivePath(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
              active ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100",
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ProviderWarning({ className }: { className?: string }) {
  const { runtime } = useApp();
  const problem = runtime?.providers?.find((p) => !p.configured);
  if (!problem?.reason) return null;
  return (
    <div className={cn("flex items-start gap-2 rounded-2xl border border-sun-200 bg-sun-50 px-3.5 py-2.5", className)}>
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-sun-500" aria-hidden />
      <p className="text-[12.5px] leading-relaxed text-ink-600">{problem.reason}</p>
    </div>
  );
}
