"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 text-white shadow-[0_6px_18px_-8px_rgba(36,103,227,0.7)] hover:bg-brand-700",
        /** The hero CTA: blue with a subtle green→blue gradient. Used sparingly. */
        cta: "cta-gradient text-white shadow-[0_10px_26px_-12px_rgba(36,103,227,0.75)] hover:brightness-[1.04]",
        secondary: "bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 hover:text-ink-900",
        soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
        ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
        whatsapp: "bg-leaf-500 text-white hover:bg-leaf-600 shadow-[0_6px_18px_-10px_rgba(22,163,74,0.8)]",
        outlineGreen: "border border-leaf-200 bg-leaf-50 text-leaf-700 hover:bg-leaf-100",
        outlineBlue: "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50",
        danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
        link: "text-brand-600 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px] [&_svg]:size-4",
        md: "h-10 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-[15px] [&_svg]:size-5",
        xl: "h-14 px-7 text-base [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-[18px]",
        iconSm: "size-8 rounded-full [&_svg]:size-4",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild = false, loading = false, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  const content = loading ? (
    <>
      <Loader2 className="animate-spin" aria-hidden />
      {children}
    </>
  ) : (
    children
  );

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </Comp>
  );
});

export { buttonVariants };
