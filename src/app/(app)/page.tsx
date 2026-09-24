import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Clock,
  Globe,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { AxloriLogo, AiSparkle } from "@/components/brand";
import { SearchForm } from "@/components/search-form";
import { HomeRecentSearches } from "@/components/home-recent-searches";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoNote } from "@/components/ui/states";
import { APP, MESSAGING } from "@/lib/constants";

export const metadata = {
  title: `${APP.name} — ${APP.tagline}`,
};

const STEPS = [
  {
    icon: Search,
    title: "Search a category + location",
    body: "Pick a business type such as barber shop, restaurant or dental clinic and choose how far to look.",
  },
  {
    icon: Globe,
    title: "Check the online presence",
    body: "See who has a website, who doesn’t, and which sites show clear, observable gaps.",
  },
  {
    icon: Wand2,
    title: "Generate personalised outreach",
    body: "Turn any business into a tailored email or WhatsApp message you can review and send yourself.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 pb-10 pt-5 lg:max-w-[1000px] lg:px-8 lg:pt-10">
      <header className="mb-5 flex flex-col items-start gap-3 lg:hidden">
        <AxloriLogo />
      </header>

      <section className="lg:mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="yellow" size="sm">
            <Sparkles />
            AI-powered prospecting
          </Badge>
          <Badge variant="blue" size="sm">
            Built for freelancers &amp; agencies
          </Badge>
        </div>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-ink-900 sm:text-[32px] lg:text-[38px]">
          Let’s find businesses
          <span className="ml-1.5 inline-flex align-middle">
            <AiSparkle size={22} className="animate-[sparkle_3s_ease-in-out_infinite]" />
          </span>
          <span className="block text-brand-600">with websites to build</span>
        </h1>
        <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink-600">
          Search for any business type, see their website and contact details, then generate personalised outreach for
          the ones that need you most.
        </p>
      </section>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
        <div className="min-w-0">
          <SearchForm variant="hero" autoFocus />
          <HomeRecentSearches className="mt-4" />
        </div>

        <aside className="mt-6 space-y-4 lg:mt-0">
          <Card className="p-4">
            <h2 className="text-[14px] font-semibold text-ink-900">How it works</h2>
            <ol className="mt-3 space-y-3.5">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-ink-800">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{step.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink-900">
              <TrendingUp className="size-4 text-leaf-600" aria-hidden />
              Your workflow
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
              Search → discover businesses → check website → analyse opportunity → save lead → generate outreach →
              contact.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Search", "Discover", "Check", "Analyse", "Save", "Reach out"].map((word) => (
                <span
                  key={word}
                  className="rounded-full border border-ink-200 px-2.5 py-1 text-[11.5px] font-medium text-ink-600"
                >
                  {word}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/saved">
                  <Bookmark />
                  Saved leads
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/templates">
                  <MessageCircle />
                  Templates
                </Link>
              </Button>
            </div>
          </Card>

          <InfoNote tone="warning" title="Demo data in use">
            {MESSAGING.demoDataBody}
          </InfoNote>
        </aside>
      </div>

      <section className="mt-7 lg:mt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "Website status on every card",
              body: "Know at a glance who needs a new site and whose site has gaps worth flagging.",
              href: "/find",
              cta: "Browse results",
            },
            {
              title: "Insights you can verify",
              body: "Every AI observation cites the data it came from, and unknowns stay unknown.",
              href: "/insights",
              cta: "See AI insights",
            },
            {
              title: "Outreach that stays yours",
              body: "Drafts open in your own email or WhatsApp. Nothing is ever sent automatically.",
              href: "/templates",
              cta: "Manage templates",
            },
          ].map((item) => (
            <Card key={item.title} className="flex flex-col p-4">
              <h3 className="text-[14px] font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-500">{item.body}</p>
              <Link
                href={item.href}
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
              >
                {item.cta}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-4 text-[12px] text-ink-400">
        <p className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {APP.name} · {APP.version}
        </p>
        <p>{MESSAGING.noAutoSendTitle}. Only publicly available business information is shown.</p>
      </footer>
    </div>
  );
}
