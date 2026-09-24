"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer size-[18px] shrink-0 rounded-[6px] border border-ink-300 bg-white transition-colors",
        "hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:bg-brand-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3.2} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

/** Full-row checkbox with label, description and an optional count. */
export function CheckboxRow({
  id,
  label,
  description,
  count,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  count?: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-ink-50",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          disabled={disabled}
        />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-ink-800">{label}</span>
          {description ? (
            <span className="mt-0.5 block truncate text-xs text-ink-500">{description}</span>
          ) : null}
        </span>
      </span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-xs font-medium tabular-nums text-ink-400">{count}</span>
      ) : null}
    </label>
  );
}
