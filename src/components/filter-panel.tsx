"use client";

import { Globe, Mail, MessageCircle, Phone, RotateCcw, Ruler, Star, Store, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/checkbox";
import { RadioGroup, RadioRow } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMPTY_FILTERS, RATING_OPTIONS, RADIUS_OPTIONS, SORT_OPTIONS } from "@/lib/constants";
import { filtersActiveCount } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { ContactFilterKey, FilterFacets, SearchFilters, SortKey, WebsiteStatus } from "@/lib/types";

/**
 * FilterPanel — one component, three homes: the desktop results sidebar, the
 * mobile Filters screen, and the tablet drawer. Filters never fabricate counts:
 * when the provider doesn't supply facets, counts are hidden rather than zeroed.
 */

export interface FilterPanelProps {
  filters: SearchFilters;
  facets?: FilterFacets | null;
  onChange: (filters: SearchFilters) => void;
  onReset?: () => void;
  /** Result count after filtering, for the mobile "Show results" CTA. */
  resultCount?: number;
  className?: string;
  stickyFooter?: React.ReactNode;
}

const WEBSITE_OPTIONS: { value: WebsiteStatus; label: string; description: string }[] = [
  { value: "has_website", label: "Has website", description: "A website URL was returned" },
  { value: "no_website", label: "No website", description: "No website on the listing" },
  { value: "unknown_website_status", label: "Website unchecked", description: "Status not yet determined" },
];

const CONTACT_OPTIONS: { value: ContactFilterKey; label: string; icon: React.ReactNode }[] = [
  { value: "phone", label: "Has phone number", icon: <Phone /> },
  { value: "email", label: "Has email", icon: <Mail /> },
  { value: "whatsapp", label: "WhatsApp available", icon: <MessageCircle /> },
];

function FilterSection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-ink-100 px-3.5 py-3.5 last:border-b-0", className)}>
      <h3 className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-ink-500">
        <span className="text-brand-500 [&_svg]:size-3.5">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FilterPanel({
  filters,
  facets,
  onChange,
  onReset,
  resultCount,
  className,
  stickyFooter,
}: FilterPanelProps) {
  const activeCount = filtersActiveCount(filters);

  const toggleWebsite = (value: WebsiteStatus, checked: boolean) => {
    const next = checked
      ? [...new Set([...filters.websiteStatus, value])]
      : filters.websiteStatus.filter((v) => v !== value);
    onChange({ ...filters, websiteStatus: next });
  };

  const toggleContact = (value: ContactFilterKey, checked: boolean) => {
    const next = checked ? [...new Set([...filters.contact, value])] : filters.contact.filter((v) => v !== value);
    onChange({ ...filters, contact: next });
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-[18px] border border-ink-200 bg-white", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-ink-100 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-ink-900">Filters</h2>
          {activeCount ? (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">{activeCount}</span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange({ ...EMPTY_FILTERS });
            onReset?.();
          }}
          disabled={!activeCount}
        >
          <RotateCcw />
          Reset
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <FilterSection title="Website Status" icon={<Globe />}>
          {WEBSITE_OPTIONS.map((option) => (
            <CheckboxRow
              key={option.value}
              id={`filter-ws-${option.value}`}
              label={option.label}
              description={option.description}
              count={facets?.websiteStatus?.[option.value]}
              checked={filters.websiteStatus.includes(option.value)}
              onCheckedChange={(checked) => toggleWebsite(option.value, checked)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Contact Availability" icon={<Phone />}>
          {CONTACT_OPTIONS.map((option) => (
            <CheckboxRow
              key={option.value}
              id={`filter-contact-${option.value}`}
              label={option.label}
              count={facets?.contact?.[option.value]}
              checked={filters.contact.includes(option.value)}
              onCheckedChange={(checked) => toggleContact(option.value, checked)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Business Rating" icon={<Star />}>
          <RadioGroup
            value={filters.minRating === null ? "0" : String(filters.minRating)}
            onValueChange={(value) => onChange({ ...filters, minRating: Number(value) || null })}
            aria-label="Minimum rating"
          >
            {RATING_OPTIONS.map((option) => (
              <RadioRow
                key={option.value}
                id={`filter-rating-${option.value}`}
                value={String(option.value)}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </FilterSection>

        <FilterSection title="Distance" icon={<Ruler />}>
          <Select
            value={filters.maxDistanceMiles === null ? "any" : String(filters.maxDistanceMiles)}
            onValueChange={(value) =>
              onChange({ ...filters, maxDistanceMiles: value === "any" ? null : Number(value) })
            }
          >
            <SelectTrigger aria-label="Maximum distance" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Within search radius</SelectItem>
              {RADIUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  Within {option} miles
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>

        <FilterSection title="Business Type" icon={<Tag />}>
          {facets?.categories?.length ? (
            facets.categories.slice(0, 8).map((item) => (
              <CheckboxRow
                key={item.category}
                id={`filter-cat-${item.category}`}
                label={item.category}
                count={item.count}
                checked={filters.categories.includes(item.category)}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    categories: checked
                      ? [...new Set([...filters.categories, item.category])]
                      : filters.categories.filter((c) => c !== item.category),
                  })
                }
              />
            ))
          ) : (
            <p className="px-2.5 py-2 text-[12.5px] leading-relaxed text-ink-500">
              The provider did not return a category breakdown for this search, so this filter is unavailable.
            </p>
          )}
        </FilterSection>
      </div>

      {stickyFooter ?? (
        <footer className="border-t border-ink-100 px-3.5 py-3">
          <p className="flex items-center gap-2 text-[12px] text-ink-500">
            <Store className="size-3.5 text-ink-400" aria-hidden />
            {typeof resultCount === "number"
              ? `${resultCount} ${resultCount === 1 ? "business" : "businesses"} match`
              : "Filters apply to the current search"}
          </p>
        </footer>
      )}
    </div>
  );
}

export function SortSelect({
  value,
  onChange,
  className,
  size = "md",
}: {
  value: SortKey;
  onChange: (sort: SortKey) => void;
  className?: string;
  size?: "md" | "sm";
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as SortKey)}>
      <SelectTrigger className={className} size={size} aria-label="Sort results">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
