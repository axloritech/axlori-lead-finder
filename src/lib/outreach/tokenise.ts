import type {
  AILeadInsight,
  Business,
  OutreachChannel,
  OutreachTemplate,
  WebsiteAnalysis,
} from "@/lib/types";
import { formatDistance, formatPhone, hostnameOf, truncate } from "@/lib/format";

export type { AILeadInsight, Business, OutreachChannel, OutreachTemplate, WebsiteAnalysis } from "@/lib/types";

/**
 * Template token engine.
 *
 * Outreach copy is never hard-coded into components: templates hold `{tokens}`
 * and this module fills them from whatever business data actually exists. Unknown
 * values collapse to a sensible fallback phrase instead of leaking `{tokens}` into
 * a message a user might send.
 */

export interface TokenDefinition {
  token: string;
  label: string;
  example: string;
  /** Grouping used by the template editor UI. */
  group: "Business" | "Location" | "Web presence" | "About you" | "AI";
}

export const TOKEN_DEFINITIONS: TokenDefinition[] = [
  { token: "{business_name}", label: "Business name", example: "Elite Cuts Barber Shop", group: "Business" },
  { token: "{category}", label: "Category", example: "Barber Shop", group: "Business" },
  { token: "{category_lower}", label: "Category (lowercase)", example: "barber shop", group: "Business" },
  { token: "{rating}", label: "Rating", example: "4.8", group: "Business" },
  { token: "{reviews}", label: "Review count", example: "124", group: "Business" },
  { token: "{city}", label: "City", example: "Columbus", group: "Location" },
  { token: "{region}", label: "Region / state", example: "Ohio", group: "Location" },
  { token: "{location}", label: "City + region", example: "Columbus, Ohio", group: "Location" },
  { token: "{distance}", label: "Distance from search", example: "2.4 mi", group: "Location" },
  { token: "{website}", label: "Website URL", example: "https://elitecuts.com", group: "Web presence" },
  { token: "{website_host}", label: "Website domain", example: "elitecuts.com", group: "Web presence" },
  { token: "{website_note}", label: "Website opportunity note", example: "no online booking was visible", group: "AI" },
  { token: "{opportunity}", label: "Top opportunity", example: "Adding online booking", group: "AI" },
  { token: "{phone}", label: "Phone number", example: "(614) 555-0142", group: "Business" },
  { token: "{email}", label: "Email address", example: "hello@elitecuts.com", group: "Business" },
  { token: "{sender_name}", label: "Your name", example: "Amina Yusuf", group: "About you" },
  { token: "{sender_company}", label: "Your company", example: "Axlori Studio", group: "About you" },
  { token: "{sender_role}", label: "Your role", example: "Web developer", group: "About you" },
  { token: "{signature}", label: "Full signature", example: "Amina Yusuf\nAxlori Studio", group: "About you" },
];

export interface TokenContext {
  business_name: string;
  category: string;
  category_lower: string;
  rating: string;
  reviews: string;
  city: string;
  region: string;
  location: string;
  distance: string;
  website: string;
  website_host: string;
  website_note: string;
  opportunity: string;
  phone: string;
  email: string;
  sender_name: string;
  sender_company: string;
  sender_role: string;
  signature: string;
}

export interface SenderProfile {
  name: string;
  company: string;
  role: string;
  signature: string;
  tone: "friendly" | "professional" | "direct";
}

export const DEFAULT_SENDER: SenderProfile = {
  name: "Alex Morgan",
  company: "Axlori Studio",
  role: "Web developer",
  signature: "Alex Morgan\nAxlori Studio · Web design & development",
  tone: "friendly",
};

export interface BuildTokenContextInput {
  business: Business;
  analysis?: WebsiteAnalysis | null;
  insight?: AILeadInsight | null;
  sender?: SenderProfile;
}

function fallback(value: string | null | undefined, replacement: string) {
  return value && value.trim().length ? value : replacement;
}

/** Phrasings that read naturally after "I noticed that …". */
const CHECK_PHRASES: Partial<Record<WebsiteAnalysis["checks"][number]["id"], string>> = {
  online_booking: "there is no way for customers to book or enquire online",
  mobile_friendly: "the site does not adapt well to phone screens",
  page_speed: "the site takes a while to load on a phone",
  basic_seo: "the site is missing a few basics that help it show up in local searches",
  clear_call_to_action: "visitors do not have an obvious next step",
  contact_information: "your contact details are not easy to find on the site",
  modern_design: "the site layout feels a little dated next to the competition",
};

/**
 * A single clause describing the most actionable website observation, written to
 * follow "I noticed that …". Derived only from what the analysis actually found —
 * never from a guess — and it degrades to safe, generic wording when nothing was
 * checked.
 */
function websiteNote(
  business: Business,
  analysis?: WebsiteAnalysis | null,
  insight?: AILeadInsight | null,
): string {
  if (!business.website) return "there is no website listed for your business yet";

  const url = business.website;
  const isSocialPage = url.includes("facebook.com") || url.includes("instagram.com");

  if (analysis && analysis.reachable === false) {
    return "the website address on your listing did not respond when it was checked";
  }
  if (isSocialPage) {
    return "your main web presence is a social page rather than your own website";
  }
  if (analysis) {
    const ranked = [...analysis.checks].sort((a, b) => {
      const weight = (c: (typeof analysis.checks)[number]) =>
        c.status === "needs_improvement" ? 0 : c.status === "not_checked" ? 1 : 2;
      return weight(a) - weight(b);
    });
    const firstGap = ranked.find((c) => c.status === "needs_improvement");
    if (firstGap && CHECK_PHRASES[firstGap.id]) return CHECK_PHRASES[firstGap.id]!;
    if (analysis.status === "good") {
      return "your site already covers the basics, so the opportunity is in small refinements";
    }
  }
  if (insight?.opportunities?.length) {
    return insight.observations?.length
      ? insight.observations[0].charAt(0).toLowerCase() + insight.observations[0].slice(1).replace(/\.$/, "")
      : "there is room to improve how your site turns visitors into enquiries";
  }
  return "there are a few things on your site that could be working harder for you";
}

export function buildTokenContext({
  business,
  analysis,
  insight,
  sender = DEFAULT_SENDER,
}: BuildTokenContextInput): TokenContext {
  const location = [business.location.city, business.location.region].filter(Boolean).join(", ");
  const host = hostnameOf(business.website);

  return {
    business_name: business.name,
    category: business.category,
    category_lower: business.category.toLowerCase(),
    rating: business.rating ? business.rating.toFixed(1) : "highly rated",
    reviews: business.reviewCount ? String(business.reviewCount) : "many",
    city: business.location.city,
    region: business.location.region ?? "",
    location: location || business.location.formatted,
    distance: formatDistance(business.distanceMiles) ?? "nearby",
    website: business.website ?? "",
    website_host: host ?? "your website",
    website_note: websiteNote(business, analysis, insight),
    opportunity: insight?.opportunities?.[0]?.title ?? "A few website improvements",
    phone: formatPhone(business.phone) ?? "",
    email: business.email ?? "",
    sender_name: fallback(sender.name, "there"),
    sender_company: fallback(sender.company, ""),
    sender_role: fallback(sender.role, "web developer"),
    signature: fallback(sender.signature, sender.name),
  };
}

/** Replace every known token; unknown tokens are left untouched so users can spot them. */
export function renderTemplate(
  template: string,
  context: TokenContext,
  options?: { stripEmptyLines?: boolean },
): string {
  const filled = template.replace(/\{([a-z_]+)\}/g, (match, key: string) => {
    const value = (context as unknown as Record<string, string>)[key];
    return value ?? match;
  });

  if (options?.stripEmptyLines === false) return filled.trim();

  return filled
    .split("\n")
    .filter((line, index, arr) => {
      if (line.trim().length) return true;
      // Collapse runs of blank lines but keep a single separator.
      const prev = arr[index - 1];
      return Boolean(prev && prev.trim().length);
    })
    .join("\n")
    .trim();
}

/** Which tokens a template actually uses — powers the "personalised with" chips. */
export function tokensUsed(template: string): string[] {
  const found = template.match(/\{([a-z_]+)\}/g) ?? [];
  return Array.from(new Set(found));
}

export function personalizationChips(tokens: string[]): string[] {
  return tokens.map((t) => TOKEN_DEFINITIONS.find((d) => d.token === t)?.label ?? t.replace(/[{}]/g, ""));
}

export function previewContextLabel(context: TokenContext, businessName: string) {
  return `${truncate(businessName, 28)} · ${context.location}`;
}

export const BUILT_IN_TEMPLATES: OutreachTemplate[] = [
  {
    id: "website-improvement",
    name: "Website Improvement",
    description: "For businesses that already have a site but are missing something obvious.",
    channel: "email",
    subject: "A few ideas for your website",
    body: `Hi {business_name} team,

I came across {business_name} while looking at {category_lower} businesses in {location}. You have a strong reputation locally — {rating} stars from {reviews} reviews is hard to earn.

Looking at your online presence, I noticed that {website_note}. That is usually one of the quickest wins for a business like yours, because people who are ready to book often leave when there is no easy next step.

I build websites and booking flows for local businesses. If it would help, I can put together a short list of practical improvements for {business_name} — no obligation, no cost.

Would you like me to send it over?

Best regards,
{signature}`,
    builtIn: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "new-website",
    name: "New Website",
    description: "For businesses with no website listed, or only a social page.",
    channel: "email",
    subject: "Website idea for your business",
    body: `Hi {business_name} team,

I was looking at {category_lower} businesses around {location} and {business_name} stood out — {rating} stars from {reviews} reviews is a great signal.

I noticed there is no website listed for you at the moment, which usually means new customers can only find you by asking around or scrolling through social posts.

I design simple, mobile-friendly websites for local businesses — the kind that show your services, hours and location clearly, and let people get in touch in one tap.

Would you be open to a 10-minute chat about what that could look like for {business_name}?

Best regards,
{signature}`,
    builtIn: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "general-introduction",
    name: "General Introduction",
    description: "A short, low-pressure first touch for any business.",
    channel: "email",
    subject: "Quick introduction — Axlori",
    body: `Hi {business_name} team,

Quick introduction: I'm {sender_name}, {sender_role} at {sender_company}. I work with local businesses in {location} on their websites and online booking.

I came across {business_name} while researching {category_lower} businesses in the area. Nothing urgent — I just wanted to introduce myself in case you ever need a hand with the website side of things.

Happy to share a couple of quick observations about your current setup if that's useful.

Best regards,
{signature}`,
    builtIn: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "whatsapp-intro",
    name: "WhatsApp Intro",
    description: "Short, friendly WhatsApp opener that respects the character limit.",
    channel: "whatsapp",
    subject: "",
    body: `Hi {business_name} 👋 I came across your {category_lower} business in {location} while researching local businesses.

I'm {sender_name}, {sender_role} at {sender_company}. I had a quick look at your online presence and spotted a couple of things that could help with bookings.

Would it be okay if I sent a short summary? No obligation at all.`,
    builtIn: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function findTemplate(templates: OutreachTemplate[], id: string) {
  return templates.find((t) => t.id === id) ?? templates[0] ?? BUILT_IN_TEMPLATES[0];
}

export function templateForChannel(
  templates: OutreachTemplate[],
  channel: OutreachChannel,
  preferredId?: string,
) {
  if (preferredId) {
    const exact = templates.find((t) => t.id === preferredId);
    if (exact && exact.channel === channel) return exact;
  }
  return templates.find((t) => t.channel === channel) ?? templates[0];
}
