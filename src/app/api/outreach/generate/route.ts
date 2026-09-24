import { NextResponse } from "next/server";
import { z } from "zod";
import { type ApiEnvelope } from "@/lib";
import { BUILT_IN_TEMPLATES } from "@/lib/outreach/tokenise";
import { businessSearchService, outreachService, websiteAnalysisService } from "@/lib/services";

export const runtime = "nodejs";

const schema = z.object({
  businessId: z.string().min(1),
  templateId: z.string().min(1),
  channel: z.enum(["email", "whatsapp"]).default("email"),
  template: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().default(""),
      channel: z.enum(["email", "whatsapp"]),
      subject: z.string().default(""),
      body: z.string().min(1),
      builtIn: z.boolean().optional(),
      updatedAt: z.string().default(() => new Date().toISOString()),
    })
    .optional(),
  sender: z
    .object({
      name: z.string().default(""),
      company: z.string().default(""),
      role: z.string().default(""),
      signature: z.string().default(""),
      tone: z.enum(["friendly", "professional", "direct"]).default("friendly"),
    })
    .optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const body: ApiEnvelope<never> = {
      ok: false,
      error: {
        code: "invalid_query",
        message: "A businessId and templateId are required.",
        hint: parsed.error.issues[0]?.message,
      },
    };
    return NextResponse.json(body, { status: 422 });
  }

  const business = await businessSearchService.getById(parsed.data.businessId);
  if (!business) {
    const body: ApiEnvelope<never> = {
      ok: false,
      error: { code: "no_results", message: "That business could not be found." },
    };
    return NextResponse.json(body, { status: 404 });
  }

  // Custom templates arrive from the client (they live in local storage); built-in
  // ones are resolved on the server so a stale client cache cannot break generation.
  const template =
    parsed.data.template ??
    BUILT_IN_TEMPLATES.find((t) => t.id === parsed.data.templateId) ??
    BUILT_IN_TEMPLATES[0];

  const analysis = await websiteAnalysisService.analyse(business);
  const result = await outreachService.generate({
    business,
    template,
    channel: parsed.data.channel,
    sender: parsed.data.sender,
    analysisFallback: analysis,
  });

  const body: ApiEnvelope<typeof result> = { ok: true, data: result };
  return NextResponse.json(body);
}
