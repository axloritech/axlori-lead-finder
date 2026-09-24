"use client";

import { useState } from "react";
import { Mail, MessageCircle, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { TOKEN_DEFINITIONS, type OutreachTemplate } from "@/lib/outreach/tokenise";
import { cn } from "@/lib/utils";
import type { OutreachChannel } from "@/lib/types";

/** Outreach template card + editor with token insertion. */
export function OutreachTemplateCard({
  template,
  onSave,
  onDelete,
  onDuplicate,
  className,
}: {
  template: OutreachTemplate;
  onSave: (template: OutreachTemplate) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (template: OutreachTemplate) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Card className={cn("flex flex-col p-4", className)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-ink-900">{template.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{template.description}</p>
          </div>
          <Badge variant={template.channel === "whatsapp" ? "green" : "blue"} size="sm">
            {template.channel === "whatsapp" ? <MessageCircle /> : <Mail />}
            {template.channel === "whatsapp" ? "WhatsApp" : "Email"}
          </Badge>
        </div>

        {template.subject ? (
          <p className="mt-3 truncate rounded-xl bg-ink-50 px-3 py-2 text-[12.5px] text-ink-600">
            <span className="font-semibold text-ink-500">Subject:</span> {template.subject}
          </p>
        ) : null}

        <p className="mt-3 line-clamp-4 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-500">
          {template.body}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil />
            Edit
          </Button>
          {onDuplicate ? (
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(template)}>
              <Plus />
              Duplicate
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="ghost"
              size="iconSm"
              className="ml-auto text-ink-400 hover:text-red-500"
              onClick={() => onDelete(template.id)}
              aria-label={`Delete ${template.name}`}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </Card>

      <TemplateEditor
        template={template}
        open={editing}
        onOpenChange={setEditing}
        onSave={(next) => {
          onSave(next);
          setEditing(false);
        }}
      />
    </>
  );
}

export function TemplateEditor({
  template,
  open,
  onOpenChange,
  onSave,
}: {
  template: OutreachTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: OutreachTemplate) => void;
}) {
  const [draft, setDraft] = useState<OutreachTemplate>(template);
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);

  const openEditor = (next: boolean) => {
    if (next) setDraft({ ...template });
    onOpenChange(next);
  };

  const insertToken = (token: string) => {
    setDraft((current) => {
      const el = bodyRef;
      if (!el) return { ...current, body: `${current.body}${token}` };
      const start = el.selectionStart ?? current.body.length;
      const end = el.selectionEnd ?? current.body.length;
      const body = `${current.body.slice(0, start)}${token}${current.body.slice(end)}`;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
      return { ...current, body };
    });
  };

  return (
    <Dialog open={open} onOpenChange={openEditor}>
      <DialogContent variant="sheet" className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit template</DialogTitle>
          <DialogDescription>
            Tokens in curly braces are replaced with real business data when a message is generated.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="template-channel">Channel</Label>
              <Select
                value={draft.channel}
                onValueChange={(value) => setDraft({ ...draft, channel: value as OutreachChannel })}
              >
                <SelectTrigger id="template-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="When should this template be used?"
            />
          </div>

          {draft.channel === "email" ? (
            <div>
              <Label htmlFor="template-subject">Subject line</Label>
              <Input
                id="template-subject"
                value={draft.subject}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="template-body">Message body</Label>
            <Textarea
              id="template-body"
              ref={setBodyRef}
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              rows={12}
              className="min-h-64"
            />
          </div>

          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-500">Insert a token</p>
            <div className="flex flex-wrap gap-1.5">
              {TOKEN_DEFINITIONS.map((token) => (
                <button
                  key={token.token}
                  type="button"
                  onClick={() => insertToken(token.token)}
                  className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  title={`${token.label} — e.g. ${token.example}`}
                >
                  {token.label}
                </button>
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setDraft({ ...template })}
            className="sm:mr-auto"
            type="button"
          >
            <RotateCcw />
            Reset changes
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave({ ...draft, updatedAt: new Date().toISOString() })}>Save template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
