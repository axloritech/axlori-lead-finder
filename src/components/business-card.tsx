"use client";

import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/rating";
import { BusinessAvatar } from "@/components/business-avatar";
import { ContactActions } from "@/components/contact-actions";
import { VerifiedBadge, WebsiteStatusBadge } from "@/components/status-badges";
import { cn } from "@/lib/utils";
import { formatDistance, formatRelativeTime, hostnameOf } from "@/lib/format";
import type { AILeadInsight, Business, CheckStatus, OutreachChannel } from "@/lib/types";

/**
 * BusinessCard — the primary result unit. Used on mobile (vertical, full width)
 * and desktop (same card, wider layout) so there is one code path to keep correct.
 */

export interface BusinessCardProps {
  business: Business;
  /** Optional AI insight — shown as an opportunity line when available. */
  insight?: AILeadInsight | null;
  websiteCheck?: CheckStatus | null;
  /** Demo/live search summary stats index, used only for the "why this ranks" hint. */
  saved?: boolean;
  onSaveToggle?: (business: Business) => void;
  onContact?: (business: Business, channel: OutreachChannel) => void;
  className?: string;
  /** Hides action buttons in dense contexts (e.g. inside dialogs). */
  showActions?: boolean;
}

export function BusinessCard({
  business,
  insight,
  websiteCheck,
  saved = false,
  onSaveToggle,
  onContact,
  className,
  showActions = true,
}: BusinessCardProps) {
  const distance = formatDistance(business.distanceMiles);
  const updated = formatRelativeTime(business.providerUpdatedAt);
  const host = hostnameOf(business.website);
  const detailHref = `/business/${encodeURIComponent(business.id)}`;

  const checkStatus: CheckStatus | null =
    websiteCheck ?? business.websiteCheckPreview?.status ?? null;

  const opportunityLabel =
    business.websiteStatus === "no_website"
      ? "No website — strong opportunity"
      : checkStatus === "needs_improvement"
        ? "Website needs improvement"
        : null;

  return (
    <article
      className={cn(
        "group relative rounded-[18px] border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <Link href={detailHref} aria-label={`View ${business.name}`} className="shrink-0">
          <BusinessAvatar name={business.name} photoUrl={business.photoUrl} size={56} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold leading-snug text-ink-900">
                <Link href={detailHref} className="hover:text-brand-700">
                  {business.name}
                </Link>
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <Rating rating={business.rating} reviewCount={business.reviewCount} size="sm" />
              </div>
            </div>

            {onSaveToggle ? (
              <button
                type="button"
                onClick={() => onSaveToggle(business)}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${business.name} from saved leads` : `Save ${business.name} as a lead`}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                  saved
                    ? "border-brand-200 bg-brand-50 text-brand-600"
                    : "border-ink-200 bg-white text-ink-400 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600",
                )}
              >
                {saved ? <BookmarkCheck className="size-[18px]" /> : <Bookmark className="size-[18px]" />}
              </button>
            ) : null}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-600">
            <span className="font-medium text-ink-700">{business.category}</span>
            <span aria-hidden className="text-ink-300">•</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-ink-400" aria-hidden />
              {[business.location.city, business.location.region].filter(Boolean).join(", ")}
            </span>
            {distance ? (
              <>
                <span aria-hidden className="text-ink-300">•</span>
                <span>{distance}</span>
              </>
            ) : null}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <WebsiteStatusBadge status={business.websiteStatus} size="sm" />
            <ContactAvailabilityBadges business={business} />
            {business.provenance.verifiedListing ? <VerifiedBadge verified size="sm" /> : null}
          </div>

          <p className="mt-2 truncate text-xs text-ink-500">
            {business.websiteStatus === "has_website" ? (
              <>
                Website:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    checkStatus === "good" && "text-leaf-600",
                    checkStatus === "needs_improvement" && "text-sun-600",
                    (checkStatus === null || checkStatus === "unknown") && "text-ink-600",
                  )}
                >
                  {checkStatus === "good"
                    ? "Good"
                    : checkStatus === "needs_improvement"
                      ? "Needs improvement"
                      : checkStatus === "unknown"
                        ? "Unknown"
                        : "Not checked"}
                </span>
                {host ? <span className="text-ink-400"> · {host}</span> : null}
              </>
            ) : business.websiteStatus === "no_website" ? (
              "No website published by the provider"
            ) : (
              "Website status not determined by the provider"
            )}
          </p>

          {opportunityLabel ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-sun-50 px-2.5 py-1.5 text-xs font-medium text-sun-600">
              <TrendingUp className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0">
                {opportunityLabel}
                {insight?.opportunities[0] ? ` · ${insight.opportunities[0].title}` : ""}
              </span>
            </p>
          ) : null}

          {updated ? (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-400">
              <Clock className="size-3" aria-hidden />
              Listing updated {updated}
            </p>
          ) : null}
        </div>
      </div>

      {showActions ? (
        <div className="mt-3.5">
          <ContactActions
            target={business}
            size="sm"
            className="[&>a]:flex-1 [&>button]:flex-1"
            onContact={(channel) => onContact?.(business, channel)}
          />
          <Link
            href={detailHref}
            className="mt-2 flex items-center justify-center gap-1 rounded-full py-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            More details
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : null}
    </article>
  );
}

/** Compact availability chips — only rendered for data the provider actually returned. */
export function ContactAvailabilityBadges({
  business,
  className,
}: {
  business: Business;
  className?: string;
}) {
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {business.phone ? (
        <Badge variant="blue" size="sm">
          <Phone />
          Has Phone
        </Badge>
      ) : (
        <Badge variant="muted" size="sm">
          <Phone />
          No Phone
        </Badge>
      )}
      {business.email ? (
        <Badge variant="blue" size="sm">
          <Mail />
          Has Email
        </Badge>
      ) : (
        <Badge variant="muted" size="sm">
          <Mail />
          No Email
        </Badge>
      )}
      {business.whatsappAvailable ? (
        <Badge variant="green" size="sm">
          <MessageCircle />
          WhatsApp
        </Badge>
      ) : null}
    </span>
  );
}
