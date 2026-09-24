import type { Business, DashboardStats, LeadStatus, SavedLead } from "@/lib/types";

/** Denormalised snapshot so the Saved screen renders instantly and offline. */
export function toSavedLead(business: Business, status: LeadStatus = "new"): SavedLead {
  return {
    businessId: business.id,
    snapshot: {
      name: business.name,
      category: business.category,
      city: business.location.city,
      region: business.location.region,
      websiteStatus: business.websiteStatus,
      phone: business.phone,
      email: business.email,
      website: business.website,
      whatsappAvailable: business.whatsappAvailable,
      rating: business.rating,
      reviewCount: business.reviewCount,
      photoUrl: business.photoUrl,
    },
    status,
    note: "",
    savedAt: new Date().toISOString(),
    lastContactedAt: null,
    contactChannel: null,
  };
}

/**
 * Rebuild a `Business` from a saved snapshot so components that expect a full
 * record (outreach generation, contact actions) can work offline from the Leads
 * list without re-fetching. Fields the snapshot never stored are explicit nulls.
 */
export function snapshotToBusiness(lead: SavedLead): Business {
  const { snapshot } = lead;
  return {
    id: lead.businessId,
    name: snapshot.name,
    category: snapshot.category,
    categories: [snapshot.category],
    location: {
      city: snapshot.city,
      region: snapshot.region,
      formatted: [snapshot.city, snapshot.region].filter(Boolean).join(", "),
      latitude: 0,
      longitude: 0,
    },
    distanceMiles: null,
    providerUpdatedAt: null,
    phone: snapshot.phone,
    whatsappAvailable: snapshot.whatsappAvailable,
    email: snapshot.email,
    website: snapshot.website,
    rating: snapshot.rating,
    reviewCount: snapshot.reviewCount,
    priceLevel: null,
    description: null,
    hours: [],
    photoUrl: snapshot.photoUrl,
    logoUrl: null,
    social: {},
    websiteStatus: snapshot.websiteStatus,
    provenance: {
      provider: "saved-lead",
      providerLabel: "Saved lead",
      kind: "demo",
      verifiedListing: false,
      retrievedAt: lead.savedAt,
      notes: "Reconstructed from the saved lead snapshot on this device.",
    },
  };
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Not contacted",
  contacted: "Contacted",
  replied: "Replied",
  converted: "Won",
  not_interested: "Not interested",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  new: "neutral",
  contacted: "info",
  replied: "info",
  converted: "success",
  not_interested: "danger",
};

export type SavedFilterKey =
  | "all"
  | "has_website"
  | "no_website"
  | "needs_improvement"
  | "contacted"
  | "not_contacted";

export const SAVED_FILTERS: { value: SavedFilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "has_website", label: "Has Website" },
  { value: "no_website", label: "No Website" },
  { value: "needs_improvement", label: "Needs Improvement" },
  { value: "contacted", label: "Contacted" },
  { value: "not_contacted", label: "Not Contacted" },
];

export function filterLeads(
  leads: SavedLead[],
  key: SavedFilterKey,
  opts?: { query?: string; category?: string },
): SavedLead[] {
  const query = opts?.query?.trim().toLowerCase() ?? "";
  return leads.filter((lead) => {
    switch (key) {
      case "has_website":
        if (lead.snapshot.websiteStatus !== "has_website") return false;
        break;
      case "no_website":
        if (lead.snapshot.websiteStatus !== "no_website") return false;
        break;
      case "needs_improvement":
        if (!lead.note.toLowerCase().includes("needs improvement") && lead.status !== "new") return false;
        break;
      case "contacted":
        if (!lead.lastContactedAt) return false;
        break;
      case "not_contacted":
        if (lead.lastContactedAt) return false;
        break;
      default:
        break;
    }
    if (opts?.category && opts.category !== "all" && lead.snapshot.category !== opts.category) return false;
    if (query) {
      const haystack = [
        lead.snapshot.name,
        lead.snapshot.category,
        lead.snapshot.city,
        lead.snapshot.region ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/** Statistics shown across the desktop dashboard and the Business Summary screen. */
export function computeStats(input: {
  current: { total: number; summary: { hasWebsite: number; noWebsite: number; needsImprovement: number; emailAvailable: number; phoneAvailable: number; whatsappAvailable: number } } | null;
  leads: SavedLead[];
}): DashboardStats {
  const { current, leads } = input;
  return {
    businessesFound: current?.total ?? 0,
    withWebsites: current?.summary.hasWebsite ?? 0,
    withoutWebsites: current?.summary.noWebsite ?? 0,
    needingImprovement: current?.summary.needsImprovement ?? 0,
    emailsAvailable: current?.summary.emailAvailable ?? 0,
    phonesAvailable: current?.summary.phoneAvailable ?? 0,
    whatsappAvailable: current?.summary.whatsappAvailable ?? 0,
    savedLeads: leads.length,
    contactedLeads: leads.filter((l) => Boolean(l.lastContactedAt)).length,
  };
}

export function sortLeadsByOpportunity(leads: SavedLead[]): SavedLead[] {
  const weight = (lead: SavedLead) => {
    let score = 0;
    if (lead.snapshot.websiteStatus === "no_website") score += 40;
    if (lead.snapshot.websiteStatus === "has_website") score += 5;
    if ((lead.snapshot.rating ?? 0) >= 4.5) score += 10;
    if ((lead.snapshot.reviewCount ?? 0) >= 50) score += 6;
    if (lead.snapshot.email) score += 6;
    if (lead.snapshot.whatsappAvailable) score += 4;
    if (lead.lastContactedAt) score -= 15;
    return score;
  };
  return [...leads].sort((a, b) => weight(b) - weight(a));
}
