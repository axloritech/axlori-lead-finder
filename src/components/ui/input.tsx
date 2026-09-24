import * as React from "react";
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-xl border border-ink-200 bg-white text-[15px] text-ink-900 placeholder:text-ink-400 transition-colors hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-ink-50 sm:text-sm";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = "text", ...props }, ref) {
    return <input ref={ref} type={type} className={cn(baseField, "h-11 px-3.5", className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(baseField, "min-h-24 resize-y px-3.5 py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
});

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink-700", className)} {...props}>
      {children}
      {required ? (
        <span className="text-brand-600" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

export function FieldHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 text-xs leading-relaxed text-ink-500", className)} {...props} />;
}

export function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn("mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600", className)}
      {...props}
    />
  );
}

/** Input with a leading icon and optional trailing adornment. */
export function InputWithIcon({
  icon,
  trailing,
  className,
  inputClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  inputClassName?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 [&_svg]:size-[18px]">
          {icon}
        </span>
      ) : null}
      <input
        className={cn(baseField, "h-11", icon ? "pl-10.5" : "pl-3.5", trailing ? "pr-11" : "pr-3.5", inputClassName)}
        {...props}
      />
      {trailing ? <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span> : null}
    </div>
  );
}
