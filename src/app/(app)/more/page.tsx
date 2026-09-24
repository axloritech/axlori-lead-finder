import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AxloriLogo } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/states";
import { MORE_NAV } from "@/components/nav-config";
import { APP, MESSAGING } from "@/lib/constants";

export const metadata = { title: "More" };

/** Mobile "More" hub — everything that doesn't fit in the bottom bar. */
export default function MorePage() {
  return (
    <>
      <PageHeader title="More" />

      <div className="mx-auto w-full max-w-[700px] px-4 pt-4">
        <Card className="flex items-center gap-3 p-4">
          <AxloriLogo compact size={38} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink-900">{APP.name}</p>
            <p className="text-[12.5px] text-ink-500">{APP.tagline}</p>
          </div>
        </Card>

        <nav aria-label="More sections" className="mt-4">
          <ul className="grid list-none gap-2.5">
            {MORE_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3.5 rounded-2xl border border-ink-200 bg-white px-4 py-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-brand-300"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold text-ink-900">{item.label}</span>
                      {item.description ? (
                        <span className="block truncate text-[12.5px] text-ink-500">{item.description}</span>
                      ) : null}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-ink-400" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <InfoNote className="mt-4" tone="info" icon={<Info className="size-4" />} title="Privacy and safety">
          {MESSAGING.noAutoSendBody} We only display publicly available business information and never expose personal
          or private details.
        </InfoNote>

        <p className="mt-4 text-center text-[11.5px] text-ink-400">
          {APP.name} · {APP.version}
        </p>
      </div>
    </>
  );
}
