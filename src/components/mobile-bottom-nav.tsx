"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_PRIMARY_NAV, isActivePath } from "@/components/nav-config";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

/**
 * MobileBottomNav — Home · Leads · Saved · More.
 *
 * Fixed to the viewport bottom with safe-area padding for notched devices, and
 * padded so content above it is never obscured (see APP_SHELL_PADDING).
 */
export const APP_SHELL_PADDING = "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { leads } = useApp();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-nav)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-1">
        {MOBILE_PRIMARY_NAV.map((item) => {
          const active = isActivePath(pathname, item);
          const Icon = item.icon;
          const count = item.href === "/saved" ? leads.length : 0;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-brand-700" : "text-ink-500 hover:text-ink-800",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-[22px]", active ? "text-brand-600" : "text-ink-400")} />
                  {count > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold leading-4 text-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
                </span>
                <span>{item.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute -top-px h-0.5 w-8 rounded-full transition-opacity",
                    active ? "bg-brand-600 opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
