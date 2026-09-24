import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating, formatReviewCount } from "@/lib/format";

export function Rating({
  rating,
  reviewCount,
  size = "md",
  className,
  showEmpty = true,
}: {
  rating: number | null;
  reviewCount?: number | null;
  size?: "sm" | "md";
  className?: string;
  showEmpty?: boolean;
}) {
  if (rating === null || rating === undefined) {
    if (!showEmpty) return null;
    return (
      <span className={cn("text-xs text-ink-400", className)} title="The provider returned no rating for this business">
        No rating provided
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-800">
        <Star className="size-3.5 fill-sun-400 text-sun-400" aria-hidden />
        {formatRating(rating)}
      </span>
      {reviewCount !== null && reviewCount !== undefined ? (
        <span className={cn("text-ink-500", size === "sm" ? "text-[11px]" : "text-xs")}>
          {formatReviewCount(reviewCount)} reviews
        </span>
      ) : (
        <span className="text-[11px] text-ink-400">reviews not provided</span>
      )}
      <span className="sr-only">
        Rated {formatRating(rating)} out of 5
        {reviewCount ? ` from ${reviewCount} reviews` : ""}
      </span>
    </span>
  );
}
