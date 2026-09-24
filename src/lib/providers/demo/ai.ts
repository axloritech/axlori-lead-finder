import { hashString } from "@/lib/utils";
import { formatPhone } from "@/lib/format";
import { MESSAGING } from "@/lib/constants";
import type {
  AILeadInsight,
  AIOpportunity,
  Business,
  OutreachChannel,
  OutreachDraft,
  OutreachTemplate,
  WebsiteAnalysis,
} from "@/lib/types";
import type { AIProvider, ProviderMeta } from "@/lib/providers/types";
import { buildTokenContext, renderTemplate } from "@/lib/outreach/tokenise";
import { blueprintForCategoryLabel } from "@/lib/providers/demo/websites";

/**
 * Demo AI provider.
 *
 * Implements the same contract as a real LLM provider, but composes its output
 * from templates + the facts that were actually returned by the data provider.
 * Consequence: every sentence is traceable to a data point, and no claim is made
 * about something the app did not observe. The `mode: "demo"` flag is surfaced in
 * the UI so users always know the difference.
 */

const META: ProviderMeta = {
  id: "demo-ai",
  label: "Axlori demo analyst",
  kind: "demo",
  productionReady: false,
};

function hasWebsite(business: Business) {
  return Boolean(business.website);
}

function isSocialOnly(business: Business) {
  const url = business.website ?? "";
  return url.includes("facebook.com") || url.includes("instagram.com");
}

function checksById(analysis?: WebsiteAnalysis | null) {
  const map = new Map<string, { status: string; detail?: string }>();
  analysis?.checks.forEach((c) => map.set(c.id, c));
  return map;
}

function buildOpportunities(business: Business, analysis?: WebsiteAnalysis | null): AIOpportunity[] {
  const blueprint = blueprintForCategoryLabel(business.category);
  const checks = checksById(analysis);
  const out: AIOpportunity[] = [];
  const strongReputation = (business.rating ?? 0) >= 4.4 && (business.reviewCount ?? 0) >= 25;

  if (!hasWebsite(business)) {
    out.push({
      title: "Launch a first website",
      detail:
        "There is no website published for this business, so customers can only find basic details through directory listings. A single-page site with services, prices, hours and a tap-to-call button would close that gap.",
      impact: strongReputation ? "high" : "medium",
      basedOn: "The provider did not return a website for this listing.",
    });
    if (strongReputation) {
      out.push({
        title: "Turn existing demand into bookings",
        detail: `${business.rating}★ from ${business.reviewCount} reviews shows people already look for this business. Capturing those searches on a simple site would grow revenue without adding marketing spend.`,
        impact: "high",
        basedOn: "Rating and review count returned by the provider.",
      });
    }
  } else if (isSocialOnly(business)) {
    out.push({
      title: "Move from a social page to a real website",
      detail:
        "The only web presence found is a social platform page. A dedicated site would give this business control over branding, search visibility and how customers get in touch.",
      impact: "high",
      basedOn: "The returned website URL points to a social platform.",
    });
  } else {
    out.push({
      title: "Strengthen the existing website",
      detail:
        "A website is already in place, so the opportunity is refinement rather than a rebuild: tighten the pages that convert visitors into enquiries.",
      impact: "low",
      basedOn: "A website URL was returned for this listing.",
    });
  }

  if (hasWebsite(business) && blueprint.bookingRelevant && checks.get("online_booking")?.status !== "good") {
    out.push({
      title: "Add online booking",
      detail:
        "No booking or reservation flow was detected on the pages that were reviewed, which means customers must call or walk in. An online booking form typically reduces missed enquiries outside opening hours.",
      impact: "high",
      basedOn: "No booking element was identified during the website review.",
    });
  }

  if (checks.get("mobile_friendly")?.status === "needs_improvement") {
    out.push({
      title: "Fix the mobile experience",
      detail:
        "The layout does not adapt well to phone screens. Most local searches for this category happen on mobile, so this is likely costing enquiries.",
      impact: "high",
      basedOn: "Responsive-layout check from the website review.",
    });
  }

  if (checks.get("page_speed")?.status === "needs_improvement") {
    out.push({
      title: "Improve page speed",
      detail:
        "Heavy, unoptimised assets slow the first load. Visitors and search engines both penalise slow pages.",
      impact: "medium",
      basedOn: "Page-load observation from the website review.",
    });
  }

  if (checks.get("basic_seo")?.status === "needs_improvement") {
    out.push({
      title: "Cover the local SEO basics",
      detail:
        "Page titles, meta descriptions and heading structure are missing, so the site gives search engines little to work with for local queries.",
      impact: "medium",
      basedOn: "SEO indicator check from the website review.",
    });
  }

  if (checks.get("clear_call_to_action")?.status === "needs_improvement") {
    out.push({
      title: "Give visitors an obvious next step",
      detail:
        "There is no prominent enquiry or booking action, so interested visitors have no clear path forward.",
      impact: "medium",
      basedOn: "Call-to-action check from the website review.",
    });
  }

  if (!business.email) {
    out.push({
      title: "Publish a contact email",
      detail:
        "No public email address was returned for this business, so enquiries depend entirely on phone calls and walk-ins.",
      impact: "low",
      basedOn: "The provider returned no email address.",
    });
  }

  if (business.phone && !business.whatsappAvailable) {
    out.push({
      title: "Offer WhatsApp enquiries",
      detail:
        "A phone number is published but the provider did not indicate a WhatsApp channel. Adding one gives customers a low-friction way to ask questions.",
      impact: "low",
      basedOn: "Phone number returned without a WhatsApp signal.",
    });
  }

  if (!business.phone) {
    out.push({
      title: "Make contact details easier to find",
      detail:
        "No public phone number was returned. Making a number visible in listings and on the site is a quick, high-value fix.",
      impact: "medium",
      basedOn: "The provider returned no phone number.",
    });
  }

  const rank: Record<AIOpportunity["impact"], number> = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.impact] - rank[b.impact]).slice(0, 5);
}

function buildObservations(business: Business, analysis?: WebsiteAnalysis | null): string[] {
  const out: string[] = [];

  if (business.rating && business.reviewCount) {
    out.push(`Rated ${business.rating}★ from ${business.reviewCount} public reviews.`);
  }
  if (business.phone) {
    out.push(`Public phone number available (${formatPhone(business.phone)}).`);
  } else {
    out.push("No public phone number was returned by the provider.");
  }
  out.push(
    business.email
      ? `Public contact email available (${business.email}).`
      : "No public contact email was returned by the provider.",
  );
  out.push(
    hasWebsite(business)
      ? isSocialOnly(business)
        ? "Web presence is limited to a social platform page."
        : `Has a website at ${business.website}`
      : "No website listed.",
  );

  if (analysis?.observations?.length) {
    out.push(...analysis.observations.slice(0, 3));
  }

  if (business.whatsappAvailable) {
    out.push("The listing indicates the business can be reached on WhatsApp.");
  }

  return out;
}

function buildSummary(business: Business, analysis?: WebsiteAnalysis | null): string {
  const name = business.name;
  const ratingPhrase =
    business.rating && business.reviewCount
      ? `${business.rating}★ across ${business.reviewCount} public reviews`
      : "an unrated public listing";

  const contactBits = [business.phone ? "phone" : null, business.email ? "email" : null].filter(Boolean);

  const firstSentence = hasWebsite(business)
    ? `${name} is a ${business.category.toLowerCase()} in ${business.location.city} with ${ratingPhrase} and an existing website.`
    : `${name} is a ${business.category.toLowerCase()} in ${business.location.city} with ${ratingPhrase} and no website listed.`;

  const secondSentence = contactBits.length
    ? `Public ${contactBits.join(" and ")} contact information is available${
        business.whatsappAvailable ? ", and the listing suggests WhatsApp is supported" : ""
      }.`
    : "No public direct contact information was returned for this listing.";

  const thirdSentence = (() => {
    if (!hasWebsite(business)) {
      return "The main gap is a first web presence that captures the demand its reviews already show.";
    }
    if (isSocialOnly(business)) {
      return "Because the web presence is a social page, there is limited control over search visibility and conversion.";
    }
    const notes = analysis?.observations ?? [];
    if (notes.length) {
      return notes[0].endsWith(".") ? notes[0] : `${notes[0]}.`;
    }
    return "The site appears to cover the basics; review the checklist below for anything that was not confirmed.";
  })();

  return `${firstSentence} ${secondSentence} ${thirdSentence}`;
}

function opportunityScore(business: Business, analysis?: WebsiteAnalysis | null) {
  let score = 30;
  if (!hasWebsite(business)) score += 34;
  else if (isSocialOnly(business)) score += 26;
  else score += 4;
  if ((business.rating ?? 0) >= 4.5) score += 8;
  if ((business.reviewCount ?? 0) >= 50) score += 6;
  if (analysis?.status === "needs_improvement") score += 16;
  if (analysis?.status === "good") score -= 12;
  if (business.email) score += 4;
  if (business.phone) score += 3;
  return Math.max(8, Math.min(98, score));
}

function confidenceOf(business: Business, analysis?: WebsiteAnalysis | null): "high" | "medium" | "low" {
  let signals = 0;
  if (business.rating) signals += 1;
  if (business.reviewCount) signals += 1;
  if (business.phone) signals += 1;
  if (business.email) signals += 1;
  if (business.website) signals += 1;
  if (analysis?.checks.some((c) => c.status === "good" || c.status === "needs_improvement")) signals += 2;
  if (signals >= 6) return "high";
  if (signals >= 4) return "medium";
  return "low";
}

function dataGaps(business: Business, analysis?: WebsiteAnalysis | null): string[] {
  const gaps: string[] = [];
  if (!business.website) gaps.push("No website published");
  if (!business.phone) gaps.push("No public phone number");
  if (!business.email) gaps.push("No public email address");
  if (!business.rating || !business.reviewCount) gaps.push("No rating or review data");
  if (business.website && !analysis) gaps.push("Website not analysed yet");
  if (analysis && !analysis.checks.some((c) => c.status === "good" || c.status === "needs_improvement")) {
    gaps.push("Website checks returned no conclusive results");
  }
  return gaps;
}

export const demoAIProvider: AIProvider = {
  meta: META,
  isConfigured: () => true,

  async analyseLead(business, website) {
    const analysis = website ?? null;
    const opportunities = buildOpportunities(business, analysis);
    return {
      id: `insight-${business.id}`,
      businessId: business.id,
      generatedAt: new Date().toISOString(),
      model: "axlori-demo-analyst",
      mode: "demo",
      summary: buildSummary(business, analysis),
      observations: buildObservations(business, analysis),
      opportunities,
      opportunityScore: opportunityScore(business, analysis),
      confidence: confidenceOf(business, analysis),
      dataGaps: dataGaps(business, analysis),
      disclaimer: MESSAGING.aiDisclaimer,
    } satisfies AILeadInsight;
  },

  async generateOutreach({ business, website, template, channel, signature }) {
    const analysis = website ?? null;
    const insight = await this.analyseLead(business, analysis);
    const context = buildTokenContext({
      business,
      analysis,
      insight,
      sender: signature
        ? {
            name: signature.split("\n")[0] ?? "Alex Morgan",
            company: signature.split("\n")[1]?.split("·")[0]?.trim() ?? "",
            role: "web developer",
            signature,
            tone: "friendly",
          }
        : undefined,
    });

    const body = renderTemplate(template.body, context);
    const subject = template.subject ? renderTemplate(template.subject, context) : null;

    return {
      id: `draft-${hashString(`${business.id}-${template.id}-${channel}`)}`,
      businessId: business.id,
      businessName: business.name,
      templateId: template.id,
      channel,
      subject,
      body,
      generatedAt: new Date().toISOString(),
      model: "axlori-demo-analyst",
      mode: "demo",
      personalization: [
        business.category,
        [business.location.city, business.location.region].filter(Boolean).join(", "),
        business.rating ? `${business.rating}★` : null,
        business.website ? "website reviewed" : "no website on file",
        analysis?.status === "needs_improvement" ? "website gaps identified" : null,
      ].filter((v): v is string => Boolean(v)),
      disclaimer: MESSAGING.noAutoSendBody,
    } satisfies OutreachDraft;
  },
};

export type { OutreachTemplate, OutreachChannel };
