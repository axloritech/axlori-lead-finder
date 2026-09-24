# Axlori Lead Finder

**Find businesses. Build opportunities.**

An AI-powered business prospecting platform for freelance web developers and agencies: search a business
category in any location, see who has a website (and who doesn't), check what their site is missing, save the
best leads, and generate personalised outreach you send yourself.

> **Runs on demo data out of the box.** No API keys are required to explore every screen. Connect a real
> business-data provider whenever you're ready — see [Connecting real providers](#connecting-real-providers).

---

## Contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Connecting real providers](#connecting-real-providers)
- [Demo data](#demo-data)
- [Screens](#screens)
- [Privacy, honesty and safety rules](#privacy-honesty-and-safety-rules)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)
- [Scripts](#scripts)

---

## What it does

`Search → Discover businesses → Check website → Analyse opportunity → Save lead → Generate outreach → Contact`

1. **Search** — pick a business type (barber shop, restaurant, dental clinic, gym, …), a location and a radius.
2. **Discover** — results come back as mobile-first cards with rating, category, distance, website status and
   which contact channels are publicly available.
3. **Check** — websites are reviewed against a checklist (mobile friendly, modern design, page speed, online
   booking, contact info, call-to-action, HTTPS, SEO basics) with statuses of **Good / Needs Improvement /
   Unknown / Not Checked**.
4. **Analyse** — an AI insight summarises what the data shows, ranks the business by opportunity and cites the
   observable fact behind every suggestion.
5. **Save** — keep businesses in a Leads list with pipeline status, notes, filtering and CSV export.
6. **Reach out** — templates are personalised with real business data, then opened in *your* email app or
   WhatsApp. Axlori never sends anything on your behalf.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run build      # production build
npm start          # run the production build
npm run lint       # eslint
npx tsc --noEmit   # type check
```

There is nothing to configure for the demo experience. To connect live data, copy `.env.example` to
`.env.local` and fill in the providers you want to use.

---

## Architecture

The UI never talks to a vendor. Everything flows through a small service layer, and providers are swapped by
environment variable — so adding Google Places, Yelp, PageSpeed or OpenAI is a config change, not a refactor.

```
                    ┌──────────────────────────────────────────┐
   React components │  src/components/**                       │
   (client + server)│  never import a provider directly        │
                    └────────────────────┬─────────────────────┘
                                         │
                    ┌────────────────────▼─────────────────────┐
   Service layer    │  businessSearchService                   │
                    │  websiteAnalysisService                  │
                    │  aiLeadAnalysisService                   │
                    │  outreachService                         │
                    └────────────────────┬─────────────────────┘
                                         │  resolves implementation at runtime
                    ┌────────────────────▼─────────────────────┐
   Providers        │  demo (bundled)  │  google_places        │
                    │  demo-website    │  pagespeed            │
                    │  demo-ai         │  openai               │
                    └──────────────────────────────────────────┘
```

### Provider contracts

Every capability is an interface in `src/lib/providers/types.ts`:

| Interface                 | Responsibility                              | Reference adapters      |
| ------------------------- | ------------------------------------------- | ----------------------- |
| `BusinessSearchProvider`  | find businesses, fetch one by id, categories | `demo`, `google_places` |
| `WebsiteAnalysisProvider` | review a publicly accessible website        | `demo`, `pagespeed`     |
| `AIProvider`              | lead insight + outreach generation          | `demo`, `openai`        |

Registry and runtime selection live in `src/lib/providers/index.ts`. If a provider is misconfigured the app
**falls back to the demo implementation and tells the user why** — it never crashes or silently pretends to
have live data.

### Data flow for a search

```
URL (?term&location&radius&sort&ws&ct&rating&distance&cats)
  └─ /find (server component)
       └─ businessSearchService.search(query)      ← provider keys stay server-side
            └─ client renders results; filters/sort/page changes push a new URL
```

The query lives in the URL, so results are shareable, bookmarkable and survive a refresh. The first page is
server-rendered for a fast first paint on mobile.

### Output safety

`snapshotToBusiness()` / `toSavedLead()` in `src/lib/leads.ts` keep saved leads renderable offline, and the
outreach dialog is mounted only while open so every field starts from props rather than being reset by
effects.

### Persistence

Saved leads, outreach templates, sender profile and search history live in `localStorage` behind
`src/lib/local-store.ts` + `useLocalStorage` (built on `useSyncExternalStore`, so there is no hydration
mismatch and multiple components stay in sync). Swapping this for a database means rewriting that one file.

---

## Connecting real providers

Each capability is independent — connect all three, or just the one you need. The app falls back to demo per
capability and the sidebar tells you exactly which parts are still demo.

```env
# 1. Real business results — the only two lines needed to stop using demo data
BUSINESS_DATA_PROVIDER=google_places
BUSINESS_DATA_API_KEY=AIza...

# 2. Real website measurements (optional)
WEBSITE_ANALYSIS_PROVIDER=pagespeed
WEBSITE_ANALYSIS_API_KEY=AIza...

# 3. Real AI insights + outreach (optional)
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

`GOOGLE_PLACES_API_KEY`, `PAGESPEED_API_KEY` and `OPENAI_API_KEY` are accepted as aliases for the three keys
above. `.env.local` is git-ignored and read on the server only.

Restart the dev server after changing env (Next.js does not hot-reload it); **Settings → Data sources** shows
which providers are active and why any provider fell back to demo mode.

### Getting the keys

**Google Places API (New)** — required for live business results:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com).
2. **Enable billing** — a card is required even to stay inside the free tier.
3. **APIs & Services → Library** → enable **Places API (New)**.
4. **APIs & Services → Credentials → Create credentials → API key**.
5. Restrict the key to *Places API (New)* only, and set a quota plus a budget alert.

Text Search is billed per request, not per result (a search returning nothing still bills). Each SKU has a free
monthly allowance, after which Text Search Pro is roughly **$32 per 1,000 calls** — check Google's current
pricing before you scale up. One Axlori search costs about 2 Text Search calls, plus one extra call the first
time a location is used (the resolved centre is cached per process). Set a daily quota in the console.

**PageSpeed Insights API** — optional, for real website measurements. Free (25,000 requests/day, 100 per 100
seconds) and **no billing account required**. Enable *PageSpeed Insights API* in the same project and create a
key restricted to that API.

**OpenAI (or compatible)** — optional, for LLM-written insights and outreach. Without it, insights and outreach
are still produced by the built-in template analyst, composed from the provider's facts.

### What changes when you go live

| | Demo | With Google Places |
| --- | --- | --- |
| Business records | Fictional samples | Real, publicly listed businesses |
| Rating / reviews / hours / phone / website | Sample values | Real values from the provider |
| Email & WhatsApp | Sometimes present | **Always "not available"** — Google does not publish them, so those buttons are disabled and those filters return nothing |
| Website checklist on result cards | Canned profile | "Not checked" until you open a business or run a check |
| "Needs Improvement" total | Estimated from reviewed samples | 0 until website checks have actually run |

Because Google publishes no email address or WhatsApp signal, the honest sourcing rules kick in: the UI states
those channels are unavailable rather than guessing.

### Writing your own adapter

1. Implement the relevant interface in `src/lib/providers/your-vendor.ts`.
2. Map the vendor payload onto our `Business` / `WebsiteAnalysis` / `AILeadInsight` types.
3. Set `provenance` so the UI can label the source (`kind: "live"`, provider id and label).
4. Register it in `src/lib/providers/index.ts`.
5. Add the environment variables to `.env.example` and the Settings screen copy.

**Rules for adapters**

- Only publicly available business information may be displayed.
- Never invent a field the vendor did not return. Missing email/phone/WhatsApp must stay `null` / `false` so
  the UI can say "not available from this provider".
- Never claim a technical measurement that was not actually performed — use `Unknown` / `Not Checked` with an
  explanation.
- No scraping. Use official, licensed APIs or datasets, and respect their terms.

There is no scraping code in this project by design.

---

## Demo data

Demo mode is a deterministic generator, not a hard-coded fixture list, so any category and any location
produces a coherent, repeatable dataset.

- `src/lib/providers/demo/categories.ts` — 27 category blueprints (barber shop, restaurant, hotel, dental,
  gym, real estate, car dealership, trades, legal, …), each with naming patterns, specialties, description
  templates and realistic website/no-website distributions.
- `src/lib/providers/demo/cities.ts` — 14 located city profiles (Columbus, Austin, Phoenix, Denver, Charlotte,
  Nashville, Tampa, Lagos, Port Harcourt, Abuja, London, Toronto, Accra, Nairobi) plus a graceful fallback for
  any location the user types.
- `src/lib/providers/demo/dataset.ts` — seeds the generator from `category + city` so the same search always
  returns the same businesses.
- `src/lib/providers/demo/websites.ts` — canned, clearly-labelled website review profiles.
- `src/lib/providers/demo/ai.ts` — composes insights strictly from the facts the data provider returned.

Everything generated is **fictional**: phone numbers use reserved fictional ranges, websites are invented and
business records are labelled `Demo data` throughout the UI. Demo business ids are self-describing
(`barber-columbus-oh-r25-143`), so a shared detail link resolves even after a server restart.

To ship real data, switch `BUSINESS_DATA_PROVIDER` — the demo folder is never imported by live adapters.

---

## Screens

### Mobile

| Screen             | Route            | Notes                                                              |
| ------------------ | ---------------- | ------------------------------------------------------------------ |
| Home / Search      | `/`              | Logo, tagline, search card (type, location, radius), recent searches |
| Search Results     | `/find`          | Summary stats, vertical cards, mobile filters, sort                |
| Business Details   | `/business/[id]` | Tabbed sections + sticky bottom action bar                         |
| AI Insights        | `/insights`      | Opportunity ranking with generated insights                        |
| Filters            | `/filters`       | Website status, contact, rating, distance, business type           |
| New Email          | Outreach dialog  | Pre-filled subject/body, opens your mail app                       |
| WhatsApp Contact   | Outreach dialog  | Pre-filled message, opens WhatsApp — never auto-sends              |
| Saved Leads        | `/saved`         | Filters, status, notes, CSV export                                 |
| Business Summary   | `/summary`       | Statistics, top categories, top opportunity leads                  |
| Settings           | `/settings`      | Profile, defaults, data sources, stored data                       |
| More               | `/more`          | Mobile hub for everything outside the bottom bar                   |

Bottom navigation: **Home · Leads · Saved · More**.

### Desktop

Left sidebar (Home, Find Businesses, Saved Leads, Outreach Templates, AI Insights, Business Summary,
Settings) · spacious results grid · filter panel and search context on the right · live provider status in the
sidebar footer.

### Reusable components

`SearchForm`, `BusinessCard`, `BusinessList`, `BusinessDetail`, `BusinessStats`, `DashboardStatGrid`,
`FilterPanel`, `SortSelect`, `WebsiteStatusBadge`, `CheckStatusBadge`, `ContactActions`, `StickyContactBar`,
`AIInsightCard`, `OutreachGenerator`, `OutreachTemplateCard`, `SavedLeadCard`, `MobileBottomNav`,
`DesktopSidebar`, `PageHeader`, `EmptyState`, `LoadingState` (skeletons + search phases), `ErrorState`,
`InfoNote`, `BusinessAvatar`, `Rating`, `Brand`.

---

## Privacy, honesty and safety rules

These are enforced in code, not just in copy:

- **Public information only.** No private or personal data is displayed, collected or inferred.
- **Nothing is sent automatically.** Email and WhatsApp actions open the user's own app with the message
  pre-filled. There is no send API call anywhere in the project.
- **Provenance is visible.** Cards, profiles and insights carry `Demo data`, provider labels, `Verified
  listing`, `AI-generated` and confidence indicators.
- **Unknowns stay unknown.** Website checks report `Unknown` / `Not Checked` with the reason rather than
  guessing, and provider gaps (no email, no WhatsApp signal) are stated explicitly.
- **Grounded AI.** The demo analyst composes insights from returned facts; the OpenAI adapter is instructed to
  use only supplied facts, to avoid inventing metrics or relationships, and to return strict JSON.
- **One failure never takes the app down.** `websiteAnalysisService`, `aiLeadAnalysisService` and
  `outreachService` each degrade individually — a provider outage yields a labelled "unavailable" section.

---

## Deploying to Vercel

1. Push the repository to Git.
2. Import the project in Vercel — the framework preset is detected automatically.
3. Add the environment variables you want (all optional; without them the app runs in demo mode).
4. Deploy.

Notes

- The app is a standard Next.js App Router project with no custom build step and no native dependencies.
- Provider keys are read in server components and route handlers only, so they are never bundled into
  client JavaScript.
- `/find` and `/business/[id]` are dynamic (they call a provider per request); everything else is static.
- `public/icon.svg`, `icon-192.png` and `icon-512.png` plus `src/app/manifest.ts` make the app installable
  (PWA-ready) with no service worker requirement.

---

## Project structure

```
src/
├── app/
│   ├── (app)/                    # authenticated-style app shell (sidebar + bottom nav)
│   │   ├── page.tsx              # Home / search
│   │   ├── find/                 # Results (server-rendered, URL-driven)
│   │   ├── business/[id]/        # Business profile
│   │   ├── saved/ insights/ summary/ filters/ templates/ settings/ more/
│   ├── api/                      # search · businesses · website-analysis · ai/insights · outreach · health
│   ├── layout.tsx globals.css manifest.ts not-found.tsx
├── components/
│   ├── ui/                       # design-system primitives (button, input, select, dialog, …)
│   ├── providers/app-provider.tsx
│   └── *.tsx                     # product components
├── hooks/                        # use-local-storage, use-async-resource, use-media-query, …
└── lib/
    ├── providers/                # interfaces + demo, google_places, pagespeed, openai adapters
    ├── services/                 # businessSearchService, websiteAnalysisService, …
    ├── outreach/tokenise.ts      # template tokens + built-in templates
    ├── types.ts config.ts constants.ts leads.ts search-params.ts format.ts utils.ts local-store.ts
```

---

## Scripts

| Command            | What it does                    |
| ------------------ | ------------------------------- |
| `npm run dev`      | Development server              |
| `npm run build`    | Production build                |
| `npm start`        | Serve the production build      |
| `npm run lint`     | ESLint (Next.js + React rules)  |
| `npx tsc --noEmit` | Type check                      |

---

## Design system

- **Hierarchy:** white → light blue → blue → small green accents → very small yellow accents.
- **Blue** — primary buttons, navigation, links, selected states.
- **Green** — WhatsApp, successful checks, "Has Website", positive results. Used sparingly.
- **Yellow** — AI sparkles, attention indicators, warnings, premium accents. Used very sparingly.
- 16–20px card radii, subtle shadows, thin borders, generous white space, Inter throughout, Lucide icons.
- Accessibility: semantic landmarks, labelled form controls, keyboard-navigable dialogs, visible focus rings,
  `aria-current` navigation, skip link, and status text that never relies on colour alone.

---

Built as a modern SaaS product for freelancers and agencies — **Axlori Lead Finder · Find businesses. Build
opportunities.**
