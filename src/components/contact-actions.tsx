"use client";

import { Copy, Globe, Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mailtoHref, telHref, whatsappHref } from "@/lib/format";
import type { OutreachChannel, WebsiteStatus } from "@/lib/types";

/**
 * Contact actions.
 *
 * Every action opens the user's own app — a dialler, WhatsApp, their mail client
 * or a new tab. Nothing is ever sent, posted or submitted by Axlori itself.
 * When a channel is unavailable we disable the control and explain why rather
 * than hiding it, so the user understands the data gap.
 */

export interface ContactTarget {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsappAvailable: boolean;
  websiteStatus?: WebsiteStatus;
}

export type ContactActionKey = "call" | "whatsapp" | "email" | "website" | "copy";

export interface DraftPayload {
  subject?: string | null;
  body: string;
}

export interface ContactActionsProps {
  target: ContactTarget;
  /** Prefills the mail composer / WhatsApp text field. */
  draft?: DraftPayload | null;
  /** Called when the user actually opens a channel — used for lead tracking. */
  onContact?: (channel: OutreachChannel) => void;
  variant?: "row" | "grid" | "stacked";
  size?: "sm" | "md" | "lg";
  /** Limit which actions render. */
  only?: ContactActionKey[];
  className?: string;
  /** Extra copy control (outreach screens). */
  onCopy?: () => void;
}

function reasonFor(action: ContactActionKey, target: ContactTarget) {
  switch (action) {
    case "call":
      return "No public phone number was returned by the data provider.";
    case "whatsapp":
      return target.phone
        ? "The provider does not indicate a WhatsApp channel for this number. You can still try calling."
        : "No public phone number was returned by the data provider.";
    case "email":
      return "No public email address was returned by the data provider.";
    case "website":
      return "No website is published for this business. This is a website opportunity.";
    default:
      return undefined;
  }
}

export function ContactActions({
  target,
  draft,
  onContact,
  variant = "row",
  size = "md",
  only,
  className,
  onCopy,
}: ContactActionsProps) {
  const callHref = telHref(target.phone);
  const waHref = whatsappHref(target.phone, draft?.body);
  const mailHref = mailtoHref(target.email, {
    subject: draft?.subject ?? `Enquiry for ${target.name}`,
    body: draft?.body ?? `Hi ${target.name} team,\n\n`,
  });
  const siteHref = target.website ?? undefined;

  const actions: {
    key: ContactActionKey;
    label: string;
    icon: React.ReactNode;
    href?: string;
    available: boolean;
    variant: "secondary" | "whatsapp" | "primary" | "outlineBlue";
    external?: boolean;
  }[] = [
    {
      key: "call",
      label: "Call",
      icon: <Phone />,
      href: callHref,
      available: Boolean(callHref),
      variant: "secondary",
      external: false,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle />,
      href: waHref,
      available: Boolean(waHref) && target.whatsappAvailable,
      variant: "whatsapp",
      external: true,
    },
    {
      key: "email",
      label: "Email",
      icon: <Mail />,
      href: mailHref,
      available: Boolean(mailHref),
      variant: "outlineBlue",
      external: false,
    },
    {
      key: "website",
      label: "Website",
      icon: <Globe />,
      href: siteHref,
      available: Boolean(siteHref),
      variant: "secondary",
      external: true,
    },
  ];

  const visible = only ? actions.filter((a) => only.includes(a.key)) : actions;

  const handleContact = (channel: OutreachChannel) => {
    onContact?.(channel);
  };

  const renderButton = (action: (typeof actions)[number]) => {
    const disabled = !action.available;
    return (
      <Button
        key={action.key}
        asChild={!disabled}
        variant={action.variant}
        size={size}
        className={cn(
          variant === "grid" && "h-auto flex-col gap-1.5 rounded-2xl py-2.5 text-[11px] font-semibold",
          variant === "row" && "flex-1",
          variant === "stacked" && "w-full justify-start",
        )}
        disabled={disabled}
        title={disabled ? reasonFor(action.key, target) : undefined}
        aria-label={disabled ? `${action.label} — unavailable. ${reasonFor(action.key, target)}` : action.label}
        tabIndex={disabled ? -1 : undefined}
      >
        {/*
          Radix `Slot` (asChild) requires exactly one child element, so the anchor is
          built as a single node rather than conditionally spliced with siblings.
        */}
        {disabled ? (
          // Not a Slot: plain button content, so a fragment is fine here.
          <>
            {action.icon}
            <span>{action.label}</span>
          </>
        ) : (
          <a
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noopener noreferrer" : undefined}
            onClick={() => {
              if (action.key === "email" || action.key === "whatsapp") {
                handleContact(action.key as OutreachChannel);
              }
            }}
          >
            {action.icon}
            <span>{action.label}</span>
          </a>
        )}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        variant === "grid" && "grid grid-cols-4 gap-2",
        variant === "row" && "flex items-center gap-2",
        variant === "stacked" && "flex flex-col gap-2",
        className,
      )}
      role="group"
      aria-label={`Contact options for ${target.name}`}
    >
      {visible.map(renderButton)}
      {onCopy ? (
        <Button
          variant="secondary"
          size={size}
          className={cn(
            variant === "grid" && "h-auto flex-col gap-1.5 rounded-2xl py-2.5 text-[11px] font-semibold",
            variant === "row" && "flex-1",
            variant === "stacked" && "w-full justify-start",
          )}
          onClick={onCopy}
          aria-label="Copy message"
        >
          <Copy />
          <span>Copy</span>
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Sticky mobile action bar for the business detail screen.
 * Call / WhatsApp / Email / Website, with a slot for the primary CTA.
 */
export function StickyContactBar({
  target,
  draft,
  onContact,
  primary,
  className,
}: {
  target: ContactTarget;
  draft?: DraftPayload | null;
  onContact?: (channel: OutreachChannel) => void;
  primary?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 -mx-4 mt-5 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:rounded-2xl lg:border lg:px-4 lg:pb-3.5",
        className,
      )}
    >
      <ContactActions
        target={target}
        draft={draft}
        onContact={onContact}
        variant="grid"
        size="sm"
        only={["call", "whatsapp", "email", "website"]}
      />
      {primary ? <div className="mt-2.5">{primary}</div> : null}
    </div>
  );
}

export function copyToClipboard(value: string, successMessage = "Copied to clipboard") {
  const write = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      toast.success(successMessage);
    } catch {
      toast.error("Could not copy automatically", {
        description: "Select the text and copy it manually.",
      });
    }
  };
  void write();
}
