import { getAIProvider } from "@/lib/providers";
import { AppError } from "@/lib/config";
import { MESSAGING } from "@/lib/constants";
import { aiLeadAnalysisService } from "@/lib/services/ai-lead-analysis";
import { websiteAnalysisService } from "@/lib/services/website-analysis";
import { buildTokenContext, renderTemplate, type SenderProfile } from "@/lib/outreach/tokenise";
import type { Business, OutreachChannel, OutreachDraft, OutreachTemplate } from "@/lib/types";

/**
 * outreachService
 *
 * Produces a ready-to-review draft. It never sends anything: the result is meant
 * to be handed to the user's own mail client or WhatsApp, where they press send.
 */

export const outreachService = {
  providerMeta() {
    return getAIProvider().status;
  },

  /**
   * Generate a personalised draft. If the AI provider is unavailable the template
   * is still rendered locally with real business data, so the feature degrades to
   * "template + personalisation" instead of failing.
   */
  async generate(input: {
    business: Business;
    template: OutreachTemplate;
    channel: OutreachChannel;
    sender?: SenderProfile;
    analysisFallback?: Awaited<ReturnType<typeof websiteAnalysisService.analyse>>;
  }): Promise<{ draft: OutreachDraft; degraded: boolean; reason?: string }> {
    const { business, template, channel, sender } = input;

    try {
      const { provider } = getAIProvider();
      const analysis =
        input.analysisFallback ??
        (await websiteAnalysisService.analyse(business));
      const draft = await provider.generateOutreach({
        business,
        website: analysis,
        template,
        channel,
        signature: sender?.signature,
      });
      return { draft, degraded: false };
    } catch (error) {
      const reason =
        error instanceof AppError ? error.message : error instanceof Error ? error.message : "Unknown error.";

      const analysis = input.analysisFallback ?? (await websiteAnalysisService.analyse(business));
      const insight = await aiLeadAnalysisService.analyse(business, analysis);
      const context = buildTokenContext({ business, analysis, insight, sender });
      const body = renderTemplate(template.body, context);

      return {
        degraded: true,
        reason,
        draft: {
          id: `draft-local-${business.id}-${template.id}`,
          businessId: business.id,
          businessName: business.name,
          templateId: template.id,
          channel,
          subject: template.subject ? renderTemplate(template.subject, context) : null,
          body,
          generatedAt: new Date().toISOString(),
          model: "axlori-template-engine",
          mode: "demo",
          personalization: [
            business.category,
            [business.location.city, business.location.region].filter(Boolean).join(", "),
            business.website ? "website reviewed" : "no website on file",
          ],
          disclaimer: MESSAGING.noAutoSendBody,
        },
      };
    }
  },

  /** Render a template without AI — used for live previews in the editor. */
  renderPreview(template: OutreachTemplate, context: ReturnType<typeof buildTokenContext>) {
    return {
      subject: template.subject ? renderTemplate(template.subject, context) : "",
      body: renderTemplate(template.body, context),
    };
  },
};

export type OutreachService = typeof outreachService;
