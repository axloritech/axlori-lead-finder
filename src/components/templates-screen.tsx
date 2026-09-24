"use client";

import { useState } from "react";
import { FileText, Plus, RotateCcw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { OutreachTemplateCard } from "@/components/outreach-template-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-provider";
import { TOKEN_DEFINITIONS, type OutreachTemplate } from "@/lib/outreach/tokenise";
import { MESSAGING } from "@/lib/constants";

export function TemplatesScreen() {
  const { templates, saveTemplate, deleteTemplate, resetTemplates } = useApp();
  const [drafting, setDrafting] = useState(false);

  const emailTemplates = templates.filter((t) => t.channel === "email");
  const whatsappTemplates = templates.filter((t) => t.channel === "whatsapp");

  const createCustom = () => {
    setDrafting(true);
    const template: OutreachTemplate = {
      id: `custom-${Date.now()}`,
      name: "New template",
      description: "Describe when this template should be used.",
      channel: "email",
      subject: "A quick idea for {business_name}",
      body: `Hi {business_name} team,\n\nI came across your {category_lower} business in {location} and wanted to reach out.\n\n{signature}`,
      updatedAt: new Date().toISOString(),
    };
    saveTemplate(template);
    setTimeout(() => setDrafting(false), 300);
  };

  const duplicate = (template: OutreachTemplate) => {
    saveTemplate({
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} (copy)`,
      builtIn: false,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <PageHeader
        title="Outreach Templates"
        subtitle="Personalised automatically with real business data when you generate a message"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={resetTemplates} className="hidden sm:inline-flex">
              <RotateCcw />
              Restore defaults
            </Button>
            <Button variant="primary" size="sm" onClick={createCustom} loading={drafting}>
              <Plus />
              New
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 lg:px-6 lg:pt-6">
        <InfoNote tone="info" title="Tokens are filled with real business data">
          Use tokens such as <code className="rounded bg-white px-1 text-[11.5px]">{"{business_name}"}</code>,{" "}
          <code className="rounded bg-white px-1 text-[11.5px]">{"{location}"}</code> and{" "}
          <code className="rounded bg-white px-1 text-[11.5px]">{"{website_note}"}</code>. When a value isn’t available,
          the sentence stays readable instead of printing an empty gap.
        </InfoNote>

        <section className="mt-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
            <FileText className="size-4 text-brand-500" aria-hidden />
            Email templates
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
              {emailTemplates.length}
            </span>
          </h2>
          <div className="mt-3 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {emailTemplates.map((template) => (
              <OutreachTemplateCard
                key={template.id}
                template={template}
                onSave={saveTemplate}
                onDuplicate={duplicate}
                onDelete={template.builtIn ? undefined : deleteTemplate}
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
            <Sparkles className="size-4 text-sun-500" aria-hidden />
            WhatsApp templates
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
              {whatsappTemplates.length}
            </span>
          </h2>
          <div className="mt-3 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {whatsappTemplates.map((template) => (
              <OutreachTemplateCard
                key={template.id}
                template={template}
                onSave={saveTemplate}
                onDuplicate={duplicate}
                onDelete={template.builtIn ? undefined : deleteTemplate}
              />
            ))}
          </div>
        </section>

        <Card className="mt-6 p-4">
          <h2 className="text-[15px] font-semibold text-ink-900">Available tokens</h2>
          <p className="mt-1 text-[13px] text-ink-500">{MESSAGING.aiDisclaimer}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOKEN_DEFINITIONS.map((token) => (
              <div key={token.token} className="rounded-xl border border-ink-200 px-3 py-2">
                <p className="font-mono text-[11.5px] font-semibold text-brand-700">{token.token}</p>
                <p className="mt-0.5 text-[12px] text-ink-600">{token.label}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-ink-400">{token.example}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={createCustom}>
            <Plus />
            Create blank template
          </Button>
        </div>
      </div>
    </>
  );
}
