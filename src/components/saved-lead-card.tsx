"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, MapPin, MessageSquare, StickyNote, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Rating } from "@/components/rating";
import { BusinessAvatar } from "@/components/business-avatar";
import { ContactActions } from "@/components/contact-actions";
import { WebsiteStatusBadge } from "@/components/status-badges";
import { GenerateOutreachButton } from "@/components/outreach-generator";
import { LEAD_STATUS_LABELS, snapshotToBusiness } from "@/lib/leads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { LeadStatus, OutreachChannel, SavedLead } from "@/lib/types";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "replied", "converted", "not_interested"];

/** SavedLeadCard — the Leads list unit, with status tracking and notes. */
export function SavedLeadCard({
  lead,
  onRemove,
  onStatusChange,
  onNoteChange,
  onContact,
  onOutreachUsed,
  className,
}: {
  lead: SavedLead;
  onRemove: (businessId: string) => void;
  onStatusChange: (businessId: string, status: LeadStatus) => void;
  onNoteChange: (businessId: string, note: string) => void;
  onContact?: (businessId: string, channel: OutreachChannel) => void;
  onOutreachUsed?: (businessId: string, channel: OutreachChannel) => void;
  className?: string;
}) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(lead.note);
  const { snapshot } = lead;

  const target = {
    id: lead.businessId,
    name: snapshot.name,
    phone: snapshot.phone,
    email: snapshot.email,
    website: snapshot.website,
    whatsappAvailable: snapshot.whatsappAvailable,
    websiteStatus: snapshot.websiteStatus,
  };

  return (
    <article
      className={cn(
        "rounded-[18px] border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <BusinessAvatar name={snapshot.name} photoUrl={snapshot.photoUrl} size={48} rounded="rounded-xl" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-ink-900">
                <Link href={`/business/${encodeURIComponent(lead.businessId)}`} className="hover:text-brand-700">
                  {snapshot.name}
                </Link>
              </h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-600">
                <span className="font-medium text-ink-700">{snapshot.category}</span>
                <span aria-hidden className="text-ink-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-ink-400" aria-hidden />
                  {[snapshot.city, snapshot.region].filter(Boolean).join(", ")}
                </span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="iconSm"
              className="text-ink-400 hover:text-red-500"
              onClick={() => onRemove(lead.businessId)}
              aria-label={`Remove ${snapshot.name} from saved leads`}
            >
              <Trash2 />
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <WebsiteStatusBadge status={snapshot.websiteStatus} size="sm" />
            {snapshot.rating ? <Rating rating={snapshot.rating} reviewCount={snapshot.reviewCount} size="sm" /> : null}
            {snapshot.whatsappAvailable ? (
              <Badge variant="green" size="sm">
                WhatsApp
              </Badge>
            ) : null}
            {lead.lastContactedAt ? (
              <Badge variant="blue" size="sm">
                <CheckCircle2 />
                Contacted {formatRelativeTime(lead.lastContactedAt)}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Not contacted
              </Badge>
            )}
          </div>

          {note && !showNote ? (
            <p className="mt-2 line-clamp-2 rounded-xl bg-ink-50 px-3 py-2 text-[12.5px] text-ink-600">{note}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3.5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <Select value={lead.status} onValueChange={(value) => onStatusChange(lead.businessId, value as LeadStatus)}>
          <SelectTrigger size="sm" aria-label={`Pipeline status for ${snapshot.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowNote((v) => !v)}>
            <StickyNote />
            Note
          </Button>
          <GenerateOutreachButton
            business={snapshotToBusiness(lead)}
            onUsed={(channel) => onOutreachUsed?.(lead.businessId, channel)}
          />
        </div>
      </div>

      {showNote ? (
        <div className="mt-3">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => onNoteChange(lead.businessId, note)}
            placeholder="Add context: who you spoke to, what they need, next steps…"
            className="min-h-20 text-[13px]"
            aria-label={`Note for ${snapshot.name}`}
          />
          <p className="mt-1 text-[11px] text-ink-400">Notes are stored on this device only.</p>
        </div>
      ) : null}

      <div className="mt-3.5 border-t border-ink-100 pt-3.5">
        <ContactActions
          target={target}
          size="sm"
          onContact={(channel) => onContact?.(lead.businessId, channel)}
        />
      </div>

      {snapshot.website ? (
        <a
          href={snapshot.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1 text-[11.5px] text-ink-400 hover:text-brand-600"
        >
          <ExternalLink className="size-3" aria-hidden />
          {snapshot.website}
        </a>
      ) : null}

      {!snapshot.phone && !snapshot.email && !snapshot.website ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-400">
          <MessageSquare className="size-3" aria-hidden />
          No public contact channels were returned for this business.
        </p>
      ) : null}
    </article>
  );
}
