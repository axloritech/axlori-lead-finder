"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, InputWithIcon, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/components/providers/app-provider";
import { POPULAR_SEARCHES, RADIUS_OPTIONS } from "@/lib/constants";
import { CITY_LIST } from "@/lib/providers/demo/cities";
import { findBlueprint } from "@/lib/providers/demo/categories";
import { buildSearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { SearchQuery } from "@/lib/types";

/**
 * SearchForm — the primary entry point of the product.
 *
 * Validates locally (so the user gets an immediate, specific error instead of a
 * round trip), then pushes a URL-encoded query to /find so results are shareable,
 * bookmarkable and refresh-safe.
 */
export function SearchForm({
  initial,
  variant = "hero",
  className,
  autoFocus = false,
}: {
  initial?: Partial<SearchQuery>;
  variant?: "hero" | "compact" | "panel";
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const { settings } = useApp();
  const termId = useId();
  const locationId = useId();
  const radiusId = useId();

  const [term, setTerm] = useState(initial?.term ?? "");
  const [location, setLocation] = useState(initial?.location ?? settings.defaultLocation ?? "");
  const [radius, setRadius] = useState(String(initial?.radiusMiles ?? settings.defaultRadius ?? 25));
  const [error, setError] = useState<{ field: "term" | "location"; message: string } | null>(null);

  // Adjust state during render when the incoming values change (React's recommended
  // alternative to syncing props inside an effect).
  const incomingKey = `${initial?.term ?? ""}::${initial?.location ?? ""}::${initial?.radiusMiles ?? ""}`;
  const [syncedKey, setSyncedKey] = useState(incomingKey);
  if (syncedKey !== incomingKey && (initial?.term || initial?.location || initial?.radiusMiles)) {
    setSyncedKey(incomingKey);
    if (initial?.term !== undefined) setTerm(initial.term);
    if (initial?.location !== undefined) setLocation(initial.location);
    if (initial?.radiusMiles !== undefined) setRadius(String(initial.radiusMiles));
  }

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const cleanTerm = term.trim();
    const cleanLocation = location.trim();

    if (cleanTerm.length < 2) {
      setError({ field: "term", message: "Enter a business type, for example “Barber shop”." });
      return;
    }
    if (cleanLocation.length < 2) {
      setError({ field: "location", message: "Enter a city, for example “Columbus, Ohio”." });
      return;
    }
    setError(null);

    const params = buildSearchParams({
      term: cleanTerm,
      location: cleanLocation,
      radiusMiles: Number(radius) || 25,
      sort: initial?.sort ?? "relevance",
      page: 1,
      filters: initial?.filters,
    });
    router.push(`/find?${params.toString()}`);
  };

  const matchedCategory = term.trim().length > 1 ? findBlueprint(term) : null;

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-[20px] border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]",
        variant === "hero" && "sm:p-5",
        variant === "panel" && "p-4",
        className,
      )}
      role="search"
      aria-label="Find businesses"
    >
      <div className="mb-3.5 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-xl bg-sun-50">
          <Sparkles className="size-3.5 animate-[sparkle_3s_ease-in-out_infinite] text-sun-500" aria-hidden />
        </span>
        <p className="text-[13px] font-semibold text-ink-700">What are you looking for?</p>
      </div>

      <div className={cn("grid gap-3.5", variant !== "compact" && "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.35fr)_170px]")}>
        <div>
          <Label htmlFor={termId}>Business type</Label>
          <InputWithIcon
            id={termId}
            icon={<Store />}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Barber shop"
            autoComplete="off"
            autoFocus={autoFocus}
            enterKeyHint="search"
            aria-invalid={error?.field === "term"}
            aria-describedby={error?.field === "term" ? `${termId}-error` : undefined}
          />
          {error?.field === "term" ? <FieldError id={`${termId}-error`}>{error.message}</FieldError> : null}
          {matchedCategory && !error ? (
            <FieldHint>
              Searching the “{matchedCategory.label}” category · {matchedCategory.keywords.slice(0, 3).join(", ")}
            </FieldHint>
          ) : null}
        </div>

        <div>
          <Label htmlFor={locationId}>Location</Label>
          <InputWithIcon
            id={locationId}
            icon={<MapPin />}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Columbus, Ohio"
            autoComplete="off"
            enterKeyHint="search"
            list={`${locationId}-suggestions`}
            aria-invalid={error?.field === "location"}
            aria-describedby={error?.field === "location" ? `${locationId}-error` : undefined}
          />
          <datalist id={`${locationId}-suggestions`}>
            {CITY_LIST.map((city) => (
              <option key={city.key} value={city.label} />
            ))}
          </datalist>
          {error?.field === "location" ? <FieldError id={`${locationId}-error`}>{error.message}</FieldError> : null}
        </div>

        <div>
          <Label htmlFor={radiusId}>Radius</Label>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger id={radiusId} aria-label="Search radius">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} miles
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" variant="cta" size="lg" block className="mt-4">
        <Search />
        Search
      </Button>

      {variant !== "compact" ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-ink-400">Try:</span>
          {POPULAR_SEARCHES.slice(0, 4).map((item) => (
            <button
              key={item.term}
              type="button"
              onClick={() => {
                setTerm(item.term);
                setLocation(item.location);
                setError(null);
              }}
              className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.term}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
