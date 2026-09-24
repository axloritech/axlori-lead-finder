"use client";

import Link from "next/link";
import {
  Bookmark,
  Building2,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Send,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { DashboardStats, SearchSummary } from "@/lib/types";

type Tone = "neutral" | "blue" | "green" | "yellow";

const TONE_STYLES: Record<Tone, { chip: string; value: string }> = {
  neutral: { chip: "bg-ink-100 text-ink-600", value: "text-ink-900" },
  blue: { chip: "bg-brand-50 text-brand-600", value: "text-ink-900" },
  green: { chip: "bg-leaf-50 text-leaf-600", value: "text-ink-900" },
  yellow: { chip: "bg-sun-50 text-sun-600", value: "text-ink-900" },
};

export interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: Tone;
  hint?: string;
  /** Optional filtered destination. */
  href?: string;
}

export function StatCard({ item, className }: { item: StatItem; className?: string }) {
  const tone = TONE_STYLES[item.tone ?? "neutral"];
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex size-8 items-center justify-center rounded-xl [&_svg]:size-4", tone.chip)}>
          {item.icon}
        </span>
      </div>
      <p className={cn("mt-3 text-[22px] font-bold leading-none tabular-nums", tone.value)}>
        {formatNumber(item.value)}
      </p>
      <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-ink-600">{item.label}</p>
      {item.hint ? <p className="mt-1 text-[11px] leading-snug text-ink-400">{item.hint}</p> : null}
    </>
  );

  const shell =
    "block rounded-2xl border border-ink-200 bg-white p-3.5 shadow-[var(--shadow-card)] transition-colors";

  if (item.href) {
    return (
      <Link href={item.href} className={cn(shell, "hover:border-brand-300 hover:bg-brand-50/40", className)}>
        {body}
      </Link>
    );
  }
  return <div className={cn(shell, className)}>{body}</div>;
}

/** Summary strip shown above search results / on the dashboard. */
export function BusinessStats({
  summary,
  className,
  compact = false,
}: {
  summary: Pick<SearchSummary, "total" | "hasWebsite" | "noWebsite" | "needsImprovement" | "analysedWebsites">;
  className?: string;
  compact?: boolean;
}) {
  const items: StatItem[] = [
    {
      key: "total",
      label: "Total Businesses",
      value: summary.total,
      icon: <Building2 />,
      tone: "blue",
    },
    { key: "has", label: "Has Website", value: summary.hasWebsite, icon: <Globe />, tone: "green" },
    { key: "none", label: "No Website", value: summary.noWebsite, icon: <TriangleAlert />, tone: "yellow" },
    {
      key: "improve",
      label: "Needs Improvement",
      value: summary.needsImprovement,
      icon: <TrendingUp />,
      tone: "yellow",
      hint:
        summary.analysedWebsites > 0
          ? `Estimated from ${formatNumber(summary.analysedWebsites)} reviewed websites`
          : "No websites reviewed yet",
    },
  ];

  return (
    <div
      className={cn(
        "grid gap-2.5",
        compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <StatCard key={item.key} item={item} />
      ))}
    </div>
  );
}

/** Full dashboard statistics grid — used on the Business Summary screen. */
export function DashboardStatGrid({ stats, className }: { stats: DashboardStats; className?: string }) {
  const items: StatItem[] = [
    { key: "found", label: "Businesses Found", value: stats.businessesFound, icon: <Building2 />, tone: "blue" },
    { key: "with", label: "With Websites", value: stats.withWebsites, icon: <Globe />, tone: "green" },
    { key: "without", label: "Without Websites", value: stats.withoutWebsites, icon: <TriangleAlert />, tone: "yellow" },
    {
      key: "improve",
      label: "Websites Needing Improvement",
      value: stats.needingImprovement,
      icon: <TrendingUp />,
      tone: "yellow",
    },
    { key: "emails", label: "Emails Available", value: stats.emailsAvailable, icon: <Mail />, tone: "blue" },
    { key: "phones", label: "Phone Numbers Available", value: stats.phonesAvailable, icon: <Phone />, tone: "blue" },
    {
      key: "whatsapp",
      label: "WhatsApp Available",
      value: stats.whatsappAvailable,
      icon: <MessageCircle />,
      tone: "green",
    },
    { key: "saved", label: "Saved Leads", value: stats.savedLeads, icon: <Bookmark />, tone: "blue" },
    { key: "contacted", label: "Contacted Leads", value: stats.contactedLeads, icon: <Send />, tone: "green" },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-3", className)}>
      {items.map((item) => (
        <StatCard key={item.key} item={item} />
      ))}
    </div>
  );
}
