import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP } from "@/lib/constants";

/**
 * Brand marks. The logo is inline SVG rather than an image asset: it stays crisp,
 * needs no network request and renders inside the sandboxed preview.
 */
export function AxloriMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={`${APP.name} logo`}
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="10" fill="url(#axlori-mark)" />
      <path
        d="M9.6 22.4 16 9.6l6.4 12.8h-3.05l-1.1-2.35h-4.5l-1.1 2.35H9.6Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="16" cy="17.2" r="1.5" fill="#ffffff" fillOpacity="0.55" />
      <defs>
        <linearGradient id="axlori-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22C55E" />
          <stop offset="0.45" stopColor="#3D82F5" />
          <stop offset="1" stopColor="#2467E3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AxloriLogo({
  className,
  compact = false,
  size = 34,
}: {
  className?: string;
  compact?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <AxloriMark size={size} />
      {compact ? null : (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-bold tracking-tight text-ink-900">
            Axlori<span className="font-semibold text-brand-600"> Lead Finder</span>
          </span>
          <span className="hidden text-[11px] font-medium text-ink-500 sm:block">Find businesses. Build opportunities.</span>
        </span>
      )}
    </span>
  );
}

/** The AI sparkle used for anything generated or inferred. Deliberately small. */
export function AiSparkle({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <Sparkles
      width={size}
      height={size}
      className={cn("text-sun-500", className)}
      strokeWidth={2.2}
      aria-hidden
    />
  );
}

export function AiBadge({ label = "AI", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-sun-200 bg-sun-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sun-600",
        className,
      )}
    >
      <AiSparkle size={11} />
      {label}
    </span>
  );
}
