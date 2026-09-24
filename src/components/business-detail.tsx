"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { BusinessAvatar } from "@/components/business-avatar";
import { Rating } from "@/components/rating";
import { ContactActions, StickyContactBar, copyToClipboard } from "@/components/contact-actions";
import { ProvenanceBadge, VerifiedBadge, WebsiteStatusBadge } from "@/components/status-badges";
import { WebsiteChecklist, WebsiteStatusSummary } from "@/components/website-analysis-panel";
import { AIInsightCard } from "@/components/ai-insight-card";
import { GenerateOutreachButton } from "@/components/outreach-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoNote } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-provider";
import { MESSAGING } from "@/lib/constants";
import { formatDistance, formatHours, formatPhone, sortHoursForDisplay, dayLabel } from "@/lib/format";
import type { AILeadInsight, Business, OutreachChannel, WebsiteAnalysis } from "@/lib/types";

/**
 * BusinessDetail — the full profile screen.
 *
 * Mobile: tabbed sections with a sticky bottom action bar.
 * Desktop: two columns so contact details, website findings and AI insight are all
 * visible at once. Every section states where its information came from.
 */
export function BusinessDetail({
  business,
  analysis,
  insight: initialInsight,
}: {
  business: Business;
  analysis: WebsiteAnalysis;
  insight: AILeadInsight;
}) {
  const { isSaved, toggleLead, markContacted, saveLead } = useApp();
  const [insight, setInsight] = useState(initialInsight);
  const [refreshing, setRefreshing] = useState(false);

  const saved = isSaved(business.id);

  const refreshInsight = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, force: true, includeWebsite: true }),
      });
      const json = await res.json();
      if (json?.ok) setInsight(json.data as AILeadInsight);
    } finally {
      setRefreshing(false);
    }
  };

  const handleContact = (channel: OutreachChannel) => {
    if (saved) markContacted(business.id, channel);
  };

  const handleOutreachUsed = (channel: OutreachChannel) => {
    if (!saved) saveLead(business);
    markContacted(business.id, channel);
  };

  const hours = sortHoursForDisplay(business.hours);
  const contactRows = [
    {
      key: "phone",
      label: "Phone",
      value: business.phone ? formatPhone(business.phone) : null,
      empty: "No public phone number returned by the provider",
      icon: <Phone className="size-4" />,
      href: business.phone ? `tel:${business.phone.replace(/[^\d+]/g, "")}` : undefined,
    },
    {
      key: "email",
      label: "Email",
      value: business.email,
      empty: "No public email address returned by the provider",
      icon: <Mail className="size-4" />,
      href: business.email ? `mailto:${business.email}` : undefined,
    },
    {
      key: "website",
      label: "Website",
      value: business.website,
      empty: "No website published for this business",
      icon: <Globe className="size-4" />,
      href: business.website ?? undefined,
      external: true,
    },
    {
      key: "address",
      label: "Address",
      value: business.location.formatted || null,
      empty: "No address returned by the provider",
      icon: <MapPin className="size-4" />,
    },
  ];

  return (
    <>
      <PageHeader
        showBack
        title={business.name}
        subtitle={[business.category, business.location.city, business.location.region]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Button
            variant={saved ? "soft" : "secondary"}
            size="sm"
            onClick={() => toggleLead(business)}
            aria-pressed={saved}
          >
            {saved ? <BookmarkCheck /> : <Bookmark />}
            <span className="hidden sm:inline">{saved ? "Saved" : "Save lead"}</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 pt-4 lg:px-6 lg:pt-6">
        {/* ---------------------------- Hero ---------------------------- */}
        <Card className="overflow-hidden">
          <div className="relative h-28 bg-[linear-gradient(120deg,var(--color-brand-100),var(--color-leaf-100)_140%)] sm:h-36">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/85 to-transparent" />
          </div>
          <div className="-mt-10 px-4 pb-4 sm:px-5">
            <div className="flex items-end gap-3.5">
              <BusinessAvatar
                name={business.name}
                photoUrl={business.photoUrl}
                size={72}
                rounded="rounded-[20px]"
                className="ring-4 ring-white"
              />
              <div className="min-w-0 flex-1 pb-1">
                <h1 className="truncate text-[19px] font-bold tracking-tight text-ink-900 sm:text-[22px]">
                  {business.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Rating rating={business.rating} reviewCount={business.reviewCount} />
                  {formatDistance(business.distanceMiles) ? (
                    <span className="text-[12.5px] text-ink-500">· {formatDistance(business.distanceMiles)} away</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="blue" size="sm">
                <Building2 />
                {business.category}
              </Badge>
              <WebsiteStatusBadge status={business.websiteStatus} size="sm" />
              {business.whatsappAvailable ? (
                <Badge variant="green" size="sm">
                  <MessageCircle />
                  WhatsApp
                </Badge>
              ) : null}
              <VerifiedBadge verified={business.provenance.verifiedListing} />
              <ProvenanceBadge provenance={business.provenance} />
            </div>

            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-ink-400" aria-hidden />
                {business.location.formatted}
              </span>
              {business.hours.length ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5 text-ink-400" aria-hidden />
                  {formatHours(business.hours)}
                </span>
              ) : null}
            </p>

            {/* Desktop primary actions */}
            <div className="mt-4 hidden flex-wrap items-center gap-2 lg:flex">
              <GenerateOutreachButton
                business={business}
                variant="primary"
                size="md"
                label="Generate outreach"
                onUsed={handleOutreachUsed}
              />
              <ContactActions
                target={business}
                onContact={handleContact}
                variant="row"
                size="md"
                className="flex-wrap"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(window.location.href, "Profile link copied")}
                aria-label="Copy link to this business"
              >
                <Share2 />
              </Button>
            </div>
          </div>
        </Card>

        {/* ------------------ Mobile tabs / Desktop columns ------------------ */}
        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-5">
          <div className="min-w-0">
            <Tabs defaultValue="overview" className="lg:hidden">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1 justify-center">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="website" className="flex-1 justify-center">
                  Website
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex-1 justify-center">
                  AI Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-3.5 space-y-4">
                <ContactCard rows={contactRows} />
                {business.hours.length ? <HoursCard hours={hours} /> : null}
                <AboutCard description={business.description} />
              </TabsContent>

              <TabsContent value="website" className="mt-3.5 space-y-4">
                <WebsiteCard business={business} analysis={analysis} />
              </TabsContent>

              <TabsContent value="ai" className="mt-3.5 space-y-4">
                <AIInsightCard insight={insight} onRefresh={refreshInsight} loading={refreshing} />
                <OutreachCard business={business} onUsed={handleOutreachUsed} />
              </TabsContent>
            </Tabs>

            {/* Desktop: everything stacked in the main column */}
            <div className="hidden space-y-4 lg:block">
              <AboutCard description={business.description} />
              <WebsiteCard business={business} analysis={analysis} />
              <OutreachCard business={business} onUsed={handleOutreachUsed} />
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            <ContactCard rows={contactRows} />
            {business.hours.length ? <HoursCard hours={hours} /> : null}
            <AIInsightCard insight={insight} onRefresh={refreshInsight} loading={refreshing} />
            <InfoNote tone="info" title={MESSAGING.noAutoSendTitle}>
              {MESSAGING.noAutoSendBody}
            </InfoNote>
          </aside>
        </div>

        {/* Mobile sticky actions */}
        <StickyContactBar
          target={business}
          onContact={handleContact}
          primary={
            <GenerateOutreachButton
              business={business}
              variant="cta"
              size="md"
              label="Generate outreach"
              onUsed={handleOutreachUsed}
            />
          }
          className="lg:hidden"
        />

        <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-400">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Business details come from {business.provenance.providerLabel}. Website checks and AI analysis are separate
          and clearly labelled. Only publicly available business information is shown.
        </p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section cards                                                              */
/* -------------------------------------------------------------------------- */

function ContactCard({
  rows,
}: {
  rows: { key: string; label: string; value: string | null; empty: string; icon: React.ReactNode; href?: string; external?: boolean }[];
}) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Contact</h2>
      <ul className="divide-y divide-ink-100">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              {row.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-400">{row.label}</p>
              {row.value ? (
                row.href ? (
                  <a
                    href={row.href}
                    target={row.external ? "_blank" : undefined}
                    rel={row.external ? "noopener noreferrer" : undefined}
                    className="break-all text-[13.5px] font-medium text-brand-700 hover:underline"
                  >
                    {row.value}
                  </a>
                ) : (
                  <p className="break-words text-[13.5px] font-medium text-ink-800">{row.value}</p>
                )
              ) : (
                <p className="text-[13px] text-ink-400">{row.empty}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function HoursCard({ hours }: { hours: ReturnType<typeof sortHoursForDisplay> }) {
  const today = new Date().getDay();
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink-900">
        <Calendar className="size-4 text-brand-500" aria-hidden />
        Opening hours
      </h2>
      <ul className="space-y-1.5">
        {hours.map((entry) => (
          <li
            key={entry.day}
            className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-[13px] ${
              entry.day === today ? "bg-brand-50 font-semibold text-brand-800" : "text-ink-600"
            }`}
          >
            <span>{dayLabel(entry.day, false)}</span>
            <span className={entry.closed || !entry.open ? "text-ink-400" : ""}>
              {entry.closed || !entry.open ? "Closed" : `${entry.open} – ${entry.close ?? ""}`}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AboutCard({ description }: { description: string | null }) {
  return (
    <Card className="p-4">
      <h2 className="mb-2 text-[15px] font-semibold text-ink-900">About</h2>
      {description ? (
        <p className="text-[14px] leading-relaxed text-ink-600">{description}</p>
      ) : (
        <p className="text-[13px] text-ink-400">The provider did not return a description for this business.</p>
      )}
    </Card>
  );
}

function WebsiteCard({ business, analysis }: { business: Business; analysis: WebsiteAnalysis }) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
          <Globe className="size-4 text-brand-500" aria-hidden />
          Website
        </h2>
        {business.website ? (
          <Button asChild variant="secondary" size="sm">
            <a href={business.website} target="_blank" rel="noopener noreferrer">
              Visit
              <ExternalLink />
            </a>
          </Button>
        ) : null}
      </div>

      {business.website ? (
        <>
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-[13.5px] font-medium text-brand-700 hover:underline"
          >
            {business.website}
          </a>
          <WebsiteStatusSummary analysis={analysis} />
          <div>
            <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-wide text-ink-500">Checklist</h3>
            <WebsiteChecklist analysis={analysis} />
          </div>
          <InfoNote tone={analysis.measurement.mode === "live" ? "info" : "warning"} title="How this was produced">
            {analysis.measurement.note}
          </InfoNote>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-sun-200 bg-sun-50 px-4 py-5">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-sun-600">
            <Star className="size-4" aria-hidden />
            Website opportunity
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
            No website is published for this business, which usually means new customers can only find them through
            listings or word of mouth. A simple site with services, hours and a contact button would close that gap.
          </p>
        </div>
      )}
    </Card>
  );
}

function OutreachCard({
  business,
  onUsed,
}: {
  business: Business;
  onUsed: (channel: OutreachChannel) => void;
}) {
  const channels: { channel: OutreachChannel; available: boolean; label: string }[] = [
    { channel: "email", available: Boolean(business.email), label: "Email outreach" },
    { channel: "whatsapp", available: Boolean(business.phone) && business.whatsappAvailable, label: "WhatsApp outreach" },
  ];

  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
        <Wand2 className="size-4 text-sun-500" aria-hidden />
        Suggested outreach
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
        Generate a message personalised with this business’s name, category, location and website findings — then review
        it and send it yourself.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {channels.map((item) => (
          <GenerateOutreachButton
            key={item.channel}
            business={business}
            channel={item.channel}
            variant={item.channel === "whatsapp" ? "outlineGreen" : "soft"}
            label={item.available ? item.label : `${item.label} (no ${item.channel} on file)`}
            onUsed={() => onUsed(item.channel)}
          />
        ))}
      </div>
      {!business.email && !business.phone ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-400">
          <Info className="size-3.5" aria-hidden />
          No public contact channel was returned, so outreach can’t be addressed yet. This lead could still be saved.
        </p>
      ) : null}
      <div className="mt-3 border-t border-ink-100 pt-3">
        <Link href="/templates" className="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
          Edit outreach templates →
        </Link>
      </div>
    </Card>
  );
}
