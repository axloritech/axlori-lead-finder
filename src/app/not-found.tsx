import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { AxloriLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-6 text-center">
      <AxloriLogo />
      <span className="mt-6 flex size-14 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-[var(--shadow-card)]">
        <Compass className="size-6" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink-900">That page doesn’t exist</h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-500">
        The business may have been removed by the data provider, or the link may be incomplete. Start a new search to keep
        prospecting.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="cta" size="lg">
          <Link href="/">
            <Search />
            New search
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/saved">Saved leads</Link>
        </Button>
      </div>
    </div>
  );
}
