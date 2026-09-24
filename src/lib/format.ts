import type { OpeningHours } from "@/lib/types";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatRating(rating: number | null | undefined) {
  if (rating === null || rating === undefined) return null;
  return rating.toFixed(1);
}

export function formatReviewCount(count: number | null | undefined) {
  if (count === null || count === undefined) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(count);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDistance(miles: number | null | undefined, unit: "mi" | "km" = "mi") {
  if (miles === null || miles === undefined) return null;
  const value = unit === "km" ? miles * 1.60934 : miles;
  return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
}

export function formatPhone(raw: string | null | undefined) {
  if (!raw) return null;
  // Keep already-international numbers readable without assuming a locale.
  if (raw.startsWith("+") && !raw.startsWith("+1")) {
    return raw.replace(/^(\+\d{1,3})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4");
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

export function telHref(raw: string | null | undefined) {
  if (!raw) return undefined;
  return `tel:${raw.replace(/[^\d+]/g, "")}`;
}

/** WhatsApp deep link — normalises to digits only, as wa.me requires. */
export function whatsappHref(raw: string | null | undefined, text?: string) {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function mailtoHref(
  email: string | null | undefined,
  opts?: { subject?: string; body?: string },
) {
  if (!email) return undefined;
  const params: string[] = [];
  if (opts?.subject) params.push(`subject=${encodeURIComponent(opts.subject)}`);
  if (opts?.body) params.push(`body=${encodeURIComponent(opts.body)}`);
  return `mailto:${email}${params.length ? `?${params.join("&")}` : ""}`;
}

export function formatDate(value: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return null;
  const diff = date - Date.now();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "minute") {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return null;
}

export function dayLabel(day: number, short = false) {
  return (short ? DAY_SHORT : DAY_LABELS)[day] ?? "";
}

export function formatHours(hours: OpeningHours[]): string {
  if (!hours?.length) return "Hours not provided";
  const today = new Date().getDay();
  const entry = hours.find((h) => h.day === today);
  if (!entry || entry.closed || !entry.open || !entry.close) return "Closed today";
  return `${entry.open} – ${entry.close}`;
}

/** Today's entry first, then the rest of the week in natural order. */
export function sortHoursForDisplay(hours: OpeningHours[]): OpeningHours[] {
  const today = new Date().getDay();
  const order = [0, 1, 2, 3, 4, 5, 6].map((i) => (today + i) % 7);
  return [...hours].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
}

export function hostnameOf(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function initialsOf(name: string) {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : plural ?? `${singular}s`;
}
