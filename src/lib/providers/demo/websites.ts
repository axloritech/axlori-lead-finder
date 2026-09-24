import { createRng, hashString } from "@/lib/utils";
import type { Business, CheckStatus, WebsiteAnalysis, WebsiteCheck, WebsiteCheckId } from "@/lib/types";
import { CATEGORY_BLUEPRINTS, type CategoryBlueprint } from "@/lib/providers/demo/categories";

/**
 * Demo website-analysis catalogue.
 *
 * These are **canned, deterministic profiles**, not measurements. The demo
 * provider labels them clearly (`measurement.mode === "heuristic"`) so the UI can
 * avoid implying a real crawl happened. Swap in the `pagespeed`-style provider
 * (`src/lib/providers/website-*.ts`) to run genuine checks.
 */

export function blueprintForCategoryLabel(label: string): CategoryBlueprint {
  return (
    CATEGORY_BLUEPRINTS.find((bp) => bp.label.toLowerCase() === label.toLowerCase()) ??
    CATEGORY_BLUEPRINTS[0]
  );
}

const CHECK_LABELS: Record<WebsiteCheckId, string> = {
  mobile_friendly: "Mobile friendly",
  modern_design: "Modern design",
  page_speed: "Page speed",
  online_booking: "Online booking",
  contact_information: "Contact information",
  clear_call_to_action: "Clear call-to-action",
  https: "HTTPS",
  basic_seo: "Basic SEO indicators",
  social_links: "Social links",
  online_menu_or_catalog: "Online menu / catalogue",
};

type CheckSpec = Partial<Record<WebsiteCheckId, { status: CheckStatus; detail?: string }>>;

const GOOD_SITE: CheckSpec = {
  mobile_friendly: { status: "good", detail: "Responsive layout detected at a mobile viewport." },
  modern_design: { status: "good", detail: "Current layout patterns and typography." },
  page_speed: { status: "good", detail: "Page responded quickly to the initial request." },
  https: { status: "good", detail: "Served over HTTPS with a valid certificate." },
  contact_information: { status: "good", detail: "Phone and address published on the site." },
  clear_call_to_action: { status: "good", detail: "Primary action visible above the fold." },
  basic_seo: { status: "good", detail: "Title, meta description and heading structure present." },
  social_links: { status: "good", detail: "Links to social profiles found." },
};

const DATED_SITE: CheckSpec = {
  mobile_friendly: { status: "needs_improvement", detail: "Fixed-width layout; content overflows on small screens." },
  modern_design: { status: "needs_improvement", detail: "Dated visual style and inconsistent typography." },
  page_speed: { status: "needs_improvement", detail: "Large, unoptimised images delayed the initial paint." },
  https: { status: "unknown", detail: "Certificate state could not be confirmed for this profile." },
  contact_information: { status: "good", detail: "Phone number and address present in the footer." },
  clear_call_to_action: { status: "needs_improvement", detail: "No obvious primary action or enquiry path." },
  basic_seo: { status: "needs_improvement", detail: "Missing meta description and structured headings." },
  social_links: { status: "needs_improvement", detail: "Social icons present but not linked." },
  online_booking: { status: "not_checked", detail: "No booking or enquiry flow detected on any page." },
};

const SOCIAL_ONLY: CheckSpec = {
  https: { status: "good", detail: "Hosted on a platform that serves over HTTPS." },
  mobile_friendly: { status: "good", detail: "Platform template adapts to mobile screens." },
  modern_design: { status: "needs_improvement", detail: "Generic platform layout with limited branding control." },
  contact_information: { status: "needs_improvement", detail: "Contact details only visible inside posts." },
  clear_call_to_action: { status: "needs_improvement", detail: "No dedicated enquiry or booking action." },
  basic_seo: { status: "needs_improvement", detail: "No control over page titles, schema or site structure." },
  page_speed: { status: "unknown", detail: "Third-party platform — page speed not measured." },
  social_links: { status: "good", detail: "This page is the social profile." },
};

const UNREACHABLE: CheckSpec = {
  mobile_friendly: { status: "unknown", detail: "Site did not respond, so layout could not be inspected." },
  modern_design: { status: "unknown", detail: "Site did not respond." },
  page_speed: { status: "unknown", detail: "Site did not respond." },
  https: { status: "unknown", detail: "Could not confirm the certificate." },
  contact_information: { status: "unknown", detail: "Content unavailable." },
  clear_call_to_action: { status: "unknown", detail: "Content unavailable." },
  basic_seo: { status: "unknown", detail: "Content unavailable." },
};

function specToChecks(spec: CheckSpec, blueprint: CategoryBlueprint): WebsiteCheck[] {
  const ids: WebsiteCheckId[] = [
    "mobile_friendly",
    "modern_design",
    "page_speed",
    "online_booking",
    "contact_information",
    "clear_call_to_action",
    "https",
    "basic_seo",
    "social_links",
  ];
  if (blueprint.menuRelevant) ids.push("online_menu_or_catalog");

  return ids.map((id) => {
    const explicit = spec[id];
    if (explicit) return { id, label: CHECK_LABELS[id], status: explicit.status, detail: explicit.detail };

    if (id === "online_booking") {
      return {
        id,
        label: CHECK_LABELS[id],
        status: blueprint.bookingRelevant ? "not_checked" : "unknown",
        detail: blueprint.bookingRelevant
          ? "No booking or reservation flow was found on the pages that were reviewed."
          : "Booking is not typically offered for this category.",
      };
    }
    if (id === "online_menu_or_catalog") {
      return {
        id,
        label: CHECK_LABELS[id],
        status: "unknown",
        detail: "No menu or catalogue page identified.",
      };
    }
    return { id, label: CHECK_LABELS[id], status: "unknown", detail: "Not observed." };
  });
}

function scoreFromChecks(checks: WebsiteCheck[]): number {
  const scored = checks.filter((c) => c.status === "good" || c.status === "needs_improvement");
  if (!scored.length) return 0;
  const total = scored.reduce((sum, c) => sum + (c.status === "good" ? 1 : 0), 0);
  return Math.round((total / scored.length) * 100);
}

function statusFromScore(score: number, reachable: boolean | null): CheckStatus {
  if (reachable === false) return "needs_improvement";
  if (score >= 75) return "good";
  if (score > 0) return "needs_improvement";
  return "unknown";
}

function buildObservations(
  checks: WebsiteCheck[],
  blueprint: CategoryBlueprint,
  kind: "good" | "dated" | "social" | "unreachable",
): string[] {
  const out: string[] = [];
  const byId = Object.fromEntries(checks.map((c) => [c.id, c]));

  if (kind === "unreachable") {
    return [
      "The published website address did not respond when checked.",
      "The listing still advertises this website, so visitors may be hitting a dead end.",
    ];
  }

  if (kind === "social") {
    out.push("The business uses a social page as its main web presence instead of its own website.");
    out.push("Contact details and opening hours are only available inside posts.");
    return out;
  }

  if (byId.mobile_friendly?.status === "good" && byId.modern_design?.status === "good") {
    out.push("The website looks modern and appears to work well on mobile screens.");
  } else {
    out.push("The website shows signs of an older layout that may not suit mobile visitors.");
  }

  if (blueprint.bookingRelevant && byId.online_booking?.status !== "good") {
    out.push("No online booking option was found, so customers have to call or walk in.");
  }
  if (byId.contact_information?.status === "good") {
    out.push("Phone number and address are published on the website.");
  } else if (byId.contact_information) {
    out.push("Contact details are not clearly presented on the website.");
  }
  if (byId.clear_call_to_action && byId.clear_call_to_action.status !== "good") {
    out.push("There is no clear next step for a visitor — no enquiry or booking action stands out.");
  }
  if (byId.https && byId.https.status === "good") {
    out.push("The site is served securely over HTTPS.");
  }
  if (byId.basic_seo && byId.basic_seo.status === "needs_improvement") {
    out.push("Basic search-engine basics such as page titles and meta descriptions are missing.");
  }
  if (byId.page_speed && byId.page_speed.status === "needs_improvement") {
    out.push("Large page assets slowed the first load, which affects both visitors and search ranking.");
  }
  return out;
}

export function buildDemoWebsiteAnalysis(business: Business): WebsiteAnalysis {
  const blueprint = blueprintForCategoryLabel(business.category);
  const url = business.website ?? "";

  if (!business.website) {
    return {
      businessId: business.id,
      url: "",
      status: "not_checked",
      score: null,
      checkedAt: new Date().toISOString(),
      reachable: null,
      checks: [],
      observations: ["No website address is published for this business."],
      measurement: {
        mode: "none",
        note: "Nothing to analyse — the provider did not return a website for this listing.",
      },
    };
  }

  const rng = createRng(hashString(`${business.id}::site`));
  const unreachable = rng() < 0.07;
  const socialOnly = url.includes("facebook.com") || url.includes("instagram.com");
  const needsWork = rng() < blueprint.needsImprovementRate + (socialOnly ? 0.35 : 0);

  const kind = unreachable ? "unreachable" : socialOnly ? "social" : needsWork ? "dated" : "good";
  const spec = kind === "unreachable" ? UNREACHABLE : kind === "social" ? SOCIAL_ONLY : kind === "dated" ? DATED_SITE : GOOD_SITE;

  const checks = specToChecks(spec, blueprint);

  // Businesses that do offer booking get a positive signal on that specific check.
  if (blueprint.bookingRelevant && kind === "good" && rng() < 0.7) {
    const booking = checks.find((c) => c.id === "online_booking");
    if (booking) {
      booking.status = "good";
      booking.detail = "A booking or enquiry form was identified on the site.";
    }
  }

  const score = kind === "unreachable" ? 0 : scoreFromChecks(checks);
  const status = statusFromScore(score, kind === "unreachable" ? false : true);

  return {
    businessId: business.id,
    url,
    status,
    score,
    checkedAt: new Date().toISOString(),
    reachable: kind !== "unreachable",
    checks,
    observations: buildObservations(checks, blueprint, kind),
    measurement: {
      mode: "heuristic",
      note: "Demo analysis. Results are illustrative sample profiles, not live measurements of this URL.",
    },
  };
}
