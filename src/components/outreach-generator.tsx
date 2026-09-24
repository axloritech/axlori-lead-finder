"use client";

import { useMemo, useState } from "react";
import { Copy, ExternalLink, Mail, MessageCircle, Send, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AiBadge } from "@/components/brand";
import { InfoNote } from "@/components/ui/states";
import { copyToClipboard } from "@/components/contact-actions";
import { api } from "@/lib/api-client";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { useApp } from "@/components/providers/app-provider";
import { mailtoHref, whatsappHref } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Business, OutreachChannel, OutreachDraft } from "@/lib/types";

/**
 * OutreachGenerator
 *
 * Generates a personalised draft, lets the user edit it, then hands it to the
 * user's own mail client or WhatsApp. Axlori never sends on the user's behalf —
 * the primary actions are "Copy message" and "Open email/WhatsApp".
 *
 * The dialog is mounted only while open, so every field starts from a clean state
 * derived from props rather than being reset by effects.
 */
export function OutreachGenerator({
  business,
  open,
  onOpenChange,
  defaultChannel = "email",
  onUsed,
}: {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultChannel?: OutreachChannel;
  onUsed?: (channel: OutreachChannel, draft: OutreachDraft) => void;
}) {
  if (!open || !business) return null;
  return (
    <OutreachDialog
      business={business}
      onOpenChange={onOpenChange}
      defaultChannel={defaultChannel}
      onUsed={onUsed}
    />
  );
}

function OutreachDialog({
  business,
  onOpenChange,
  defaultChannel,
  onUsed,
}: {
  business: Business;
  onOpenChange: (open: boolean) => void;
  defaultChannel: OutreachChannel;
  onUsed?: (channel: OutreachChannel, draft: OutreachDraft) => void;
}) {
  const { templates, settings } = useApp();
  const [channel, setChannel] = useState<OutreachChannel>(defaultChannel);
  const [templateId, setTemplateId] = useState<string>(
    () => templates.find((t) => t.channel === defaultChannel)?.id ?? "",
  );
  /** `null` = show the freshly generated copy; an object = the user's edits. */
  const [edited, setEdited] = useState<{ subject: string; body: string } | null>(null);

  const channelTemplates = useMemo(() => templates.filter((t) => t.channel === channel), [templates, channel]);
  const activeTemplateId = channelTemplates.some((t) => t.id === templateId)
    ? templateId
    : (channelTemplates[0]?.id ?? "");
  const activeTemplate = channelTemplates.find((t) => t.id === activeTemplateId);

  const key = `${business.id}::${activeTemplateId}::${channel}`;
  const resource = useAsyncResource(
    key,
    (signal) =>
      api.generateOutreach(
        {
          businessId: business.id,
          templateId: activeTemplateId,
          channel,
          template: activeTemplate,
          sender: settings.sender,
        },
        signal,
      ),
    { skip: !activeTemplateId },
  );

  const generated = resource.data;
  const loading = resource.status === "loading";
  const failed = resource.status === "error";
  const draft = generated?.draft ?? null;

  const subject = edited?.subject ?? draft?.subject ?? "";
  const body = edited?.body ?? draft?.body ?? "";

  const target = channel === "email" ? business.email : business.phone;
  const openHref =
    channel === "email"
      ? mailtoHref(business.email, { subject, body })
      : whatsappHref(business.phone, body);

  const handleUse = () => {
    if (!draft) return;
    onUsed?.(channel, { ...draft, subject: subject || draft.subject, body });
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="max-h-[94vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="ai-ring flex size-8 items-center justify-center rounded-xl">
              <Wand2 className="size-4 text-sun-500" aria-hidden />
            </span>
            New outreach
          </DialogTitle>
          <DialogDescription>
            Personalised for <span className="font-semibold text-ink-700">{business.name}</span>. Edit anything before
            you send it.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 pb-4">
          <Tabs value={channel} onValueChange={(value) => setChannel(value as OutreachChannel)}>
            <TabsList className="w-full">
              <TabsTrigger value="email" className="flex-1 justify-center">
                <Mail className="size-3.5" />
                Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex-1 justify-center">
                <MessageCircle className="size-3.5" />
                WhatsApp
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="outreach-template">Template</Label>
              <Select value={activeTemplateId} onValueChange={setTemplateId}>
                <SelectTrigger id="outreach-template">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {channelTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex flex-wrap items-center gap-1.5 pb-2.5">
                <Badge variant={target ? "green" : "muted"} size="sm">
                  {channel === "email" ? <Mail /> : <MessageCircle />}
                  {target ?? `No public ${channel === "email" ? "email" : "number"}`}
                </Badge>
                {draft ? <AiBadge label={draft.mode === "demo" ? "AI · demo" : "AI"} /> : null}
              </div>
            </div>
          </div>

          {failed ? (
            <InfoNote tone="warning" title="Could not generate a personalised draft">
              {resource.error?.message} You can still write your own message below and send it manually.
            </InfoNote>
          ) : null}

          {channel === "email" ? (
            <div>
              <Label htmlFor="outreach-subject">Subject</Label>
              <Input
                id="outreach-subject"
                value={loading ? "" : subject}
                placeholder={loading ? "Generating…" : "A few ideas for your website"}
                onChange={(event) => setEdited({ subject: event.target.value, body })}
                disabled={loading}
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="outreach-body">Message</Label>
            <Textarea
              id="outreach-body"
              value={loading ? "Generating a personalised draft…" : body}
              onChange={(event) => setEdited({ subject, body: event.target.value })}
              rows={10}
              disabled={loading}
              className={cn("min-h-52", loading && "animate-pulse text-ink-400")}
            />
            <p className="mt-1.5 text-xs text-ink-500">
              {channel === "whatsapp"
                ? `${body.length} characters · WhatsApp messages work best under 500 characters.`
                : `${body.split(/\s+/).filter(Boolean).length} words`}
            </p>
          </div>

          {draft?.personalization?.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Personalised with</span>
              {draft.personalization.map((item) => (
                <Badge key={item} variant="neutral" size="sm">
                  <Sparkles className="size-3 text-sun-500" />
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}

          <InfoNote tone="info" title="Nothing is sent automatically">
            Axlori opens your own email app or WhatsApp with this message pre-filled. You review it and press send
            yourself.
          </InfoNote>
        </DialogBody>

        <DialogFooter className="lg:flex-row">
          <Button
            variant="secondary"
            onClick={() => copyToClipboard([subject, body].filter(Boolean).join("\n\n"), "Message copied")}
            disabled={loading || !body.trim()}
            className="sm:flex-1"
          >
            <Copy />
            Copy message
          </Button>
          {openHref && !loading ? (
            <Button asChild variant={channel === "whatsapp" ? "whatsapp" : "primary"} className="sm:flex-1">
              <a
                href={openHref}
                target={channel === "whatsapp" ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={handleUse}
              >
                {channel === "email" ? <Mail /> : <Send />}
                {channel === "email" ? "Open email" : "Open WhatsApp"}
                <ExternalLink className="size-3.5 opacity-70" />
              </a>
            </Button>
          ) : (
            <Button variant="secondary" disabled className="sm:flex-1">
              {loading
                ? "Generating…"
                : `No public ${channel === "email" ? "email address" : "number"} available`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Trigger button used on cards, the detail page and the insights screen. */
export function GenerateOutreachButton({
  business,
  channel = "email",
  size = "sm",
  variant = "soft",
  label = "Generate outreach",
  onUsed,
}: {
  business: Business;
  channel?: OutreachChannel;
  size?: "sm" | "md" | "lg";
  variant?: "soft" | "primary" | "cta" | "secondary" | "outlineBlue" | "outlineGreen" | "whatsapp";
  label?: string;
  onUsed?: (channel: OutreachChannel, draft: OutreachDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Wand2 />
        {label}
      </Button>
      <OutreachGenerator
        business={business}
        open={open}
        onOpenChange={setOpen}
        defaultChannel={channel}
        onUsed={onUsed}
      />
    </>
  );
}
