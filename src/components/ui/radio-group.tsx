"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-1", className)} {...props} />;
});

export const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "size-[18px] shrink-0 rounded-full border border-ink-300 bg-white transition-colors",
        "hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "data-[state=checked]:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex size-full items-center justify-center">
        <span className="size-2 rounded-full bg-brand-600" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

export function RadioRow({
  id,
  value,
  label,
  description,
  count,
}: {
  id: string;
  value: string;
  label: string;
  description?: string;
  count?: number;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-ink-50"
    >
      <span className="flex min-w-0 items-center gap-3">
        <RadioGroupItem id={id} value={value} />
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
