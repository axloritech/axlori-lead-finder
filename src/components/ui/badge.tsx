import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium leading-none whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "border-ink-200 bg-ink-50 text-ink-600",
        blue: "border-brand-200 bg-brand-50 text-brand-700",
        solidBlue: "border-transparent bg-brand-600 text-white",
        green: "border-leaf-200 bg-leaf-50 text-leaf-700",
        solidGreen: "border-transparent bg-leaf-500 text-white",
        yellow: "border-sun-200 bg-sun-50 text-sun-600",
        outline: "border-ink-200 bg-white text-ink-600",
        danger: "border-red-100 bg-red-50 text-red-600",
        muted: "border-transparent bg-ink-100 text-ink-500",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-[13px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
