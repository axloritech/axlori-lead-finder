"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Bookmark, Search } from "lucide-react";
import { AxloriLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the sticky app bar.
 *
 * On mobile it mirrors a native app bar: brand (or back button) on the left, a
 * title when needed, and quick actions on the right.
 */
export function PageHeader({
  title,
  subtitle,
  showBack = false,
  actions,
  className,
  transparent = false,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}) {
  const router = useRouter();
  const { leads } = useApp();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b",
        transparent ? "border-transparent bg-transparent" : "border-ink-200 bg-brand-50/90 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-3 lg:px-6">
        {showBack ? (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
            className="shrink-0 lg:hidden"
          >
            <ArrowLeft />
          </Button>
        ) : (
          <Link href="/" className="shrink-0 lg:hidden" aria-label="Axlori Lead Finder home">
            <AxloriLogo compact size={30} />
          </Link>
        )}

        {title ? (
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold text-ink-900 sm:text-base">{title}</h1>
            {subtitle ? <p className="truncate text-[12px] text-ink-500">{subtitle}</p> : null}
          </div>
        ) : (
          <span className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Search businesses">
            <Link href="/find">
              <Search />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label={`Saved leads (${leads.length})`}>
            <Link href="/saved">
              <span className="relative">
                <Bookmark />
                {leads.length ? (
                  <span className="absolute -right-1.5 -top-1.5 size-2 rounded-full bg-brand-600" aria-hidden />
                ) : null}
              </span>
            </Link>
          </Button>
          {title ? (
            <Button variant="ghost" size="icon" aria-label="Notifications" className="hidden sm:inline-flex">
              <Bell />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
