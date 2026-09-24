import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/format";

/**
 * Business image. Providers that return photos supply a URL through
 * `photoUrl`; anything else falls back to a deterministic initials tile so the
 * layout never collapses and we never show a misleading placeholder photo.
 */

const TILE_STYLES = [
  "bg-brand-50 text-brand-700 border-brand-100",
  "bg-leaf-50 text-leaf-700 border-leaf-100",
  "bg-ink-50 text-ink-600 border-ink-200",
  "bg-sun-50 text-sun-600 border-sun-100",
] as const;

function tileStyle(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return TILE_STYLES[sum % TILE_STYLES.length];
}

export function BusinessAvatar({
  name,
  photoUrl,
  size = 56,
  className,
  rounded = "rounded-2xl",
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const isRenderablePhoto = Boolean(photoUrl && /^https?:\/\//.test(photoUrl));

  if (isRenderablePhoto) {
    return (
      // Provider-hosted images are unoptimised third-party URLs, so a plain img
      // with lazy loading keeps this simple and avoids a remote-pattern allowlist.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl as string}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ width: size, height: size }}
        className={cn("shrink-0 border border-ink-200 object-cover", rounded, className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.32) }}
      className={cn(
        "flex shrink-0 items-center justify-center border font-bold uppercase tracking-tight",
        rounded,
        tileStyle(name),
        className,
      )}
    >
      {name ? initialsOf(name) : <Store className="size-5" />}
    </span>
  );
}
