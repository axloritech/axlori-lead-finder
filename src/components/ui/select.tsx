"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { size?: "md" | "sm" }
>(function SelectTrigger({ className, children, size = "md", ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-3.5 text-left text-[15px] font-medium text-ink-800 transition-colors",
        "hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100",
        "data-[placeholder]:text-ink-400 disabled:cursor-not-allowed disabled:bg-ink-50 sm:text-sm",
        size === "md" ? "h-11" : "h-9 text-[13px]",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-ink-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          "z-60 max-h-72 min-w-[10rem] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-raised)]",
          "data-[state=open]:animate-[fade-up_0.18s_ease-out]",
          position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-xl py-2 pl-8 pr-3 text-[14px] text-ink-700 outline-none",
        "data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-800 data-[state=checked]:font-semibold data-[state=checked]:text-brand-800",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-brand-600" strokeWidth={3} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export function SelectGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  );
}

export function SelectSeparator() {
  return <SelectPrimitive.Separator className="my-1 h-px bg-ink-100" />;
}
