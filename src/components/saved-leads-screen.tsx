"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Download, Search, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SavedLeadCard } from "@/components/saved-lead-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithIcon } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { StatCard } from "@/components/business-stats";
import { useApp } from "@/components/providers/app-provider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SAVED_FILTERS, filterLeads, sortLeadsByOpportunity, type SavedFilterKey } from "@/lib/leads";
import { formatNumber, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LeadStatus, OutreachChannel } from "@/lib/types";

export function SavedLeadsScreen() {
  const { leads, leadsHydrated, removeLead, updateLeadStatus, updateLead, markContacted } = useApp();
  const [filter, setFilter] = useState<SavedFilterKey>("all");
  const [query, setQuery] = useState("");
  const [sortByOpportunity, setSortByOpportunity] = useState(false);

  // Debounced so typing stays responsive once the list grows.
  const debouncedQuery = useDebouncedValue(query, 200);

  const visible = useMemo(() => {
    const list = filterLeads(leads, filter, { query: debouncedQuery });
    const sorted = [...list].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
    return sortByOpportunity ? sortLeadsByOpportunity(sorted) : sorted;
  }, [leads, filter, debouncedQuery, sortByOpportunity]);

  const counts = useMemo(() => {
    const map = new Map<SavedFilterKey, number>();
    SAVED_FILTERS.forEach(({ value }) => map.set(value, filterLeads(leads, value, { query: debouncedQuery }).length));
    return map;
  }, [leads, debouncedQuery]);

  const exportCsv = () => {
    const header = ["Name", "Category", "City", "Region", "Website", "Website status", "Phone", "Email", "Status"];
    const rows = visible.map((lead) => [
      lead.snapshot.name,
      lead.snapshot.category,
      lead.snapshot.city,
      lead.snapshot.region ?? "",
      lead.snapshot.website ?? "",
      lead.snapshot.websiteStatus,
      lead.snapshot.phone ?? "",
      lead.snapshot.email ?? "",
      lead.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `axlori-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported leads as CSV");
  };

  const uncontacted = leads.filter((lead) => !lead.lastContactedAt).length;
  const withEmail = leads.filter((lead) => lead.snapshot.email).length;
  const noWebsite = leads.filter((lead) => lead.snapshot.websiteStatus === "no_website").length;

  return (
    <>
      <PageHeader
        title="Saved Leads"
        subtitle={
          leads.length
            ? `${formatNumber(leads.length)} ${pluralize(leads.length, "business", "businesses")} in your list`
            : "Businesses you keep will appear here"
        }
        actions={
          leads.length ? (
            <Button variant="secondary" size="sm" onClick={exportCsv} className="hidden sm:inline-flex">
              <Download />
              Export CSV
            </Button>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 lg:px-6 lg:pt-6">
        {!leadsHydrated ? (
          <p className="text-[13px] text-ink-500">Loading your saved leads…</p>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<Bookmark />}
            title="No saved leads yet"
            description="Search for businesses and tap the bookmark icon on any card to keep it here. Saved leads stay on this device."
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
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <StatCard item={{ key: "all", label: "Saved Leads", value: leads.length, icon: <Bookmark />, tone: "blue" }} />
              <StatCard
                item={{ key: "uncontacted", label: "Not Contacted", value: uncontacted, icon: <Target />, tone: "yellow" }}
              />
              <StatCard
                item={{ key: "email", label: "With Email", value: withEmail, icon: <Sparkles />, tone: "green" }}
              />
              <StatCard
                item={{ key: "noweb", label: "No Website", value: noWebsite, icon: <Target />, tone: "yellow" }}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                {SAVED_FILTERS.map((item) => {
                  const active = filter === item.value;
                  const count = counts.get(item.value) ?? 0;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                        active
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700",
                      )}
                    >
                      {item.label}
                      <span className={cn("tabular-nums", active ? "text-white/80" : "text-ink-400")}>{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <InputWithIcon
                  icon={<Search />}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search saved leads"
                  aria-label="Search saved leads"
                  className="min-w-0 flex-1 lg:w-64"
                />
                <Button
                  variant={sortByOpportunity ? "soft" : "secondary"}
                  size="md"
                  onClick={() => setSortByOpportunity((v) => !v)}
                  aria-pressed={sortByOpportunity}
                  className="shrink-0"
                >
                  <Sparkles />
                  <span className="hidden sm:inline">Opportunity</span>
                </Button>
              </div>
            </div>

            {sortByOpportunity ? (
              <p className="mt-2 text-[12px] text-ink-500">
                Ranked by website opportunity: no-website leads and highly rated businesses first.
              </p>
            ) : null}

            {visible.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<Search />}
                  title="Nothing matches this filter"
                  description="Try another filter or clear your search to see all saved leads."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFilter("all");
                        setQuery("");
                      }}
                    >
                      Show all leads
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="mt-4 grid list-none gap-3.5 xl:grid-cols-2">
                {visible.map((lead) => (
                  <li key={lead.businessId} className="min-w-0">
                    <SavedLeadCard
                      lead={lead}
                      onRemove={removeLead}
                      onStatusChange={(id, status: LeadStatus) => updateLeadStatus(id, status)}
                      onNoteChange={(id, note) => updateLead(id, { note })}
                      onContact={(id: string, channel: OutreachChannel) => markContacted(id, channel)}
                      onOutreachUsed={(id, channel) => markContacted(id, channel)}
                    />
                  </li>
                ))}
              </ul>
            )}

            {leads.length ? (
              <Card className="mt-4 p-4">
                <p className="text-[12.5px] leading-relaxed text-ink-500">
                  Saved leads are stored in this browser only. Connect a backend or account system later and this screen
                  keeps working — the storage layer is isolated in one place.
                </p>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
