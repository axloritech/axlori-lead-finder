import { AppError } from "@/lib/config";
import { MESSAGING } from "@/lib/constants";
import type {
  AILeadInsight,
  AIOpportunity,
  Business,
  OutreachDraft,
  WebsiteAnalysis,
} from "@/lib/types";
import type { AIProvider, ProviderMeta } from "@/lib/providers/types";
import { buildTokenContext, renderTemplate } from "@/lib/outreach/tokenise";

/**
 * OpenAI-compatible AI adapter.
 *
 * The system prompt is deliberately strict: the model may only reason about facts
 * present in the payload, must mark anything else as unavailable, and must frame
 * its output as observations/suggestions rather than verified measurements.
 *
 * Enable with:
 *   AI_PROVIDER=openai
 *   AI_API_KEY=…
 *   AI_MODEL=gpt-4o-mini   (optional)
 */

const META: ProviderMeta = {
  id: "openai",
  label: "OpenAI-compatible model",
  kind: "live",
  productionReady: true,
};

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

const SYSTEM_PROMPT = `You are a lead analyst for a web-development agency tool called Axlori Lead Finder.

Rules you must never break:
1. Use ONLY the business facts supplied in the user message. Never invent details about a business.
2. If a fact was not supplied, say it is unavailable — do not guess phone numbers, emails, technologies, traffic or revenue.
3. Never claim a technical measurement was performed unless the payload contains it.
4. Frame website findings as observations ("no booking link was found on the reviewed pages") rather than verified facts about the whole site.
5. Keep the tone professional and neutral. No hype, no emoji.

Return strict JSON matching this shape:
{
  "summary": string,                      // 2-4 sentences
  "observations": string[],               // factual, each under 140 chars
  "opportunities": [{"title": string, "detail": string, "impact": "high"|"medium"|"low", "basedOn": string}],
  "opportunityScore": number,             // 0-100, higher = more web-development opportunity
  "confidence": "high"|"medium"|"low",
  "dataGaps": string[]
}`;

function businessPayload(business: Business, analysis?: WebsiteAnalysis | null) {
  return {
    business: {
      name: business.name,
      category: business.category,
      city: business.location.city,
      region: business.location.region ?? null,
      distanceMiles: business.distanceMiles,
      rating: business.rating,
      reviewCount: business.reviewCount,
      phone: business.phone,
      email: business.email,
      website: business.website,
      whatsappAvailable: business.whatsappAvailable,
      description: business.description,
      hoursProvided: business.hours.length > 0,
      provider: business.provenance.providerLabel,
      providerKind: business.provenance.kind,
    },
    websiteAnalysis: analysis
      ? {
          url: analysis.url,
          measurementMode: analysis.measurement.mode,
          measurementNote: analysis.measurement.note,
          reachable: analysis.reachable,
          status: analysis.status,
          checks: analysis.checks.map((c) => ({ id: c.id, label: c.label, status: c.status, detail: c.detail })),
          observations: analysis.observations,
        }
      : "not run",
  };
}

export function createOpenAIProvider(apiKey: string, model: string): AIProvider {
  async function chat(messages: { role: "system" | "user"; content: string }[]) {
    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages,
        }),
        cache: "no-store",
      });
    } catch (error) {
      throw new AppError(
        "network",
        "The AI provider could not be reached.",
        error instanceof Error ? error.message : undefined,
      );
    }

    const json = (await res.json()) as ChatCompletionResponse;
    if (!res.ok) {
      throw new AppError(
        res.status === 429 ? "rate_limited" : "ai_unavailable",
        "The AI provider rejected the request.",
        json.error?.message,
      );
    }
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new AppError("ai_unavailable", "The AI provider returned an empty response.");

    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new AppError("ai_unavailable", "The AI provider returned a response that could not be parsed.");
    }
  }

  return {
    meta: META,
    isConfigured: () => apiKey.trim().length > 0,

    async analyseLead(business, website): Promise<AILeadInsight> {
      const raw = await chat([
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyse this lead and return JSON only.\n\n${JSON.stringify(
            businessPayload(business, website),
            null,
            2,
          )}`,
        },
      ]);

      const opportunities = Array.isArray(raw.opportunities)
        ? (raw.opportunities as AIOpportunity[]).filter((o) => o && typeof o.title === "string")
        : [];

      return {
        id: `insight-${business.id}`,
        businessId: business.id,
        generatedAt: new Date().toISOString(),
        model,
        mode: "live",
        summary: typeof raw.summary === "string" ? raw.summary : "No summary was returned.",
        observations: Array.isArray(raw.observations)
          ? (raw.observations as unknown[]).filter((o): o is string => typeof o === "string")
          : [],
        opportunities: opportunities.slice(0, 6),
        opportunityScore:
          typeof raw.opportunityScore === "number" ? Math.max(0, Math.min(100, raw.opportunityScore)) : 50,
        confidence:
          raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "low"
            ? raw.confidence
            : "medium",
        dataGaps: Array.isArray(raw.dataGaps)
          ? (raw.dataGaps as unknown[]).filter((g): g is string => typeof g === "string")
          : [],
        disclaimer: MESSAGING.aiDisclaimer,
      };
    },

    async generateOutreach({ business, website, template, channel, signature }): Promise<OutreachDraft> {
      const insight = await this.analyseLead(business, website);

      const context = buildTokenContext({
        business,
        analysis: website,
        insight,
        sender: signature
          ? {
              name: signature.split("\n")[0] ?? "",
              company: signature.split("\n")[1]?.split("·")[0]?.trim() ?? "",
              role: "web developer",
              signature,
              tone: "friendly",
            }
          : undefined,
      });

      // The template stays the source of truth for structure; the model only
      // rewrites it in the sender's voice, which keeps output on-brand and safe.
      const rewritten = await chat([
        {
          role: "system",
          content:
            "You rewrite outreach emails for a web developer. Keep the same structure, length and intent. " +
            "Use only the supplied facts. Never invent a website detail, metric or prior relationship. " +
            'Return JSON: {"subject": string, "body": string, "personalization": string[]}',
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              channel,
              template: { name: template.name, subject: template.subject, body: template.body },
              facts: businessPayload(business, website),
              tokens: context,
            },
            null,
            2,
          ),
        },
      ]);

      const body = typeof rewritten.body === "string" ? rewritten.body : renderTemplate(template.body, context);
      const subject =
        typeof rewritten.subject === "string" && rewritten.subject.trim().length
          ? rewritten.subject
          : template.subject
            ? renderTemplate(template.subject, context)
            : null;

      return {
        id: `draft-${business.id}-${template.id}`,
        businessId: business.id,
        businessName: business.name,
        templateId: template.id,
        channel,
        subject,
        body,
        generatedAt: new Date().toISOString(),
        model,
        mode: "live",
        personalization: Array.isArray(rewritten.personalization)
          ? (rewritten.personalization as unknown[]).filter((p): p is string => typeof p === "string")
          : [],
        disclaimer: MESSAGING.noAutoSendBody,
      };
    },
  };
}
