"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, Database, Globe, Info, RotateCcw, Sparkles, Trash2, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldHint } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwitchRow } from "@/components/ui/switch";
import { InfoNote } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-provider";
import { RADIUS_OPTIONS, MESSAGING, APP } from "@/lib/constants";
import { CITY_LIST } from "@/lib/providers/demo/cities";
import { cn } from "@/lib/utils";
import type { ProviderRole, ProviderStatus } from "@/lib/providers";

const ROLE_LABELS: Record<ProviderRole, string> = {
  business: "Business data",
  website: "Website checks",
  ai: "AI analysis",
};

/** Fallback shown if /api/health is unreachable — never presented as live. */
const FALLBACK_PROVIDERS: ProviderStatus[] = [
  { id: "demo", label: "Axlori demo dataset", role: "business", kind: "demo", configured: true },
  { id: "demo", label: "Axlori demo website review", role: "website", kind: "demo", configured: true },
  { id: "demo", label: "Axlori demo analyst", role: "ai", kind: "demo", configured: true },
];

export function SettingsScreen() {
  const { settings, updateSettings, resetTemplates, history, clearHistory, leads, removeLead, runtime } = useApp();
  const [sender, setSender] = useState(settings.sender);

  // Provider status comes from the server via the app context, so it is correct on
  // first paint and we avoid a duplicate request.
  const providers = runtime?.providers ?? FALLBACK_PROVIDERS;

  // Keep the editable copy in step with stored settings without an effect.
  const [syncedSender, setSyncedSender] = useState(settings.sender);
  if (syncedSender !== settings.sender) {
    setSyncedSender(settings.sender);
    setSender(settings.sender);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, defaults and data sources" />

      <div className="mx-auto w-full max-w-[900px] px-4 pt-4 lg:px-6 lg:pt-6">
        <div className="space-y-4">
          {/* -------------------- Your details -------------------- */}
          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
              <User className="size-4 text-brand-500" aria-hidden />
              Your details
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Used to personalise outreach messages. Stored on this device only — never sent to a provider.
            </p>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sender-name">Your name</Label>
                <Input
                  id="sender-name"
                  value={sender.name}
                  onChange={(event) => setSender({ ...sender, name: event.target.value })}
                  onBlur={() => updateSettings({ sender })}
                  placeholder="Alex Morgan"
                />
              </div>
              <div>
                <Label htmlFor="sender-company">Company / studio</Label>
                <Input
                  id="sender-company"
                  value={sender.company}
                  onChange={(event) => setSender({ ...sender, company: event.target.value })}
                  onBlur={() => updateSettings({ sender })}
                  placeholder="Axlori Studio"
                />
              </div>
              <div>
                <Label htmlFor="sender-role">Your role</Label>
                <Input
                  id="sender-role"
                  value={sender.role}
                  onChange={(event) => setSender({ ...sender, role: event.target.value })}
                  onBlur={() => updateSettings({ sender })}
                  placeholder="Web developer"
                />
              </div>
              <div>
                <Label htmlFor="sender-tone">Tone</Label>
                <Select
                  value={sender.tone}
                  onValueChange={(value) => {
                    const next = { ...sender, tone: value as typeof sender.tone };
                    setSender(next);
                    updateSettings({ sender: next });
                  }}
                >
                  <SelectTrigger id="sender-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="sender-signature">Email signature</Label>
              <Textarea
                id="sender-signature"
                value={sender.signature}
                onChange={(event) => setSender({ ...sender, signature: event.target.value })}
                onBlur={() => updateSettings({ sender })}
                rows={3}
                placeholder={"Alex Morgan\nAxlori Studio · Web design & development"}
              />
              <FieldHint>Inserted wherever an outreach template uses the {"{signature}"} token.</FieldHint>
            </div>
          </Card>

          {/* -------------------- Search defaults -------------------- */}
          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
              <Building2 className="size-4 text-brand-500" aria-hidden />
              Search defaults
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="default-location">Default location</Label>
                <Input
                  id="default-location"
                  list="settings-cities"
                  value={settings.defaultLocation}
                  onChange={(event) => updateSettings({ defaultLocation: event.target.value })}
                  placeholder="Columbus, Ohio"
                />
                <datalist id="settings-cities">
                  {CITY_LIST.map((city) => (
                    <option key={city.key} value={city.label} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="default-radius">Default radius</Label>
                <Select
                  value={String(settings.defaultRadius)}
                  onValueChange={(value) => updateSettings({ defaultRadius: Number(value) })}
                >
                  <SelectTrigger id="default-radius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option} miles
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="distance-unit">Distance unit</Label>
                <Select
                  value={settings.distanceUnit}
                  onValueChange={(value) => updateSettings({ distanceUnit: value as "mi" | "km" })}
                >
                  <SelectTrigger id="distance-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mi">Miles</SelectItem>
                    <SelectItem value="km">Kilometres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-1 divide-y divide-ink-100">
              <SwitchRow
                id="auto-analyse"
                label="Include website checks in results"
                description="Attach the website review status to each result card. Turn off for faster searches."
                checked={settings.autoAnalyse}
                onCheckedChange={(checked) => updateSettings({ autoAnalyse: checked })}
              />
            </div>
          </Card>

          {/* -------------------- Data sources -------------------- */}
          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
              <Database className="size-4 text-brand-500" aria-hidden />
              Data sources
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              Axlori is provider-agnostic. It works with any legitimate business-data API — no scraping — and falls back
              to clearly-labelled demo data when nothing is configured.
            </p>

            <div className="mt-3 space-y-2.5">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-3.5 py-3",
                    provider.kind === "demo" ? "border-sun-200 bg-sun-50/60" : "border-leaf-200 bg-leaf-50/60",
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    {provider.kind === "demo" ? (
                      <Sparkles className="size-4 text-sun-500" />
                    ) : (
                      <BadgeCheck className="size-4 text-leaf-600" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-ink-800">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        {ROLE_LABELS[provider.role]}
                      </span>
                      {provider.label}
                      <Badge variant={provider.kind === "demo" ? "yellow" : "green"} size="sm">
                        {provider.kind === "demo" ? "Demo" : "Live"}
                      </Badge>
                    </p>
                    {provider.reason ? (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{provider.reason}</p>
                    ) : (
                      <p className="mt-1 text-[12.5px] text-ink-600">
                        {provider.kind === "demo"
                          ? "Generated sample records so every screen can be explored."
                          : "Connected and returning live data."}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-ink-200 bg-ink-50/60 p-3.5">
              <p className="text-[12.5px] font-semibold text-ink-700">Connect a provider</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
                Add these to your environment and restart. Keys stay server-side and are never exposed to the browser.
              </p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-ink-900 px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-100">
{`BUSINESS_DATA_PROVIDER=google_places
BUSINESS_DATA_API_KEY=…
WEBSITE_ANALYSIS_PROVIDER=pagespeed
WEBSITE_ANALYSIS_API_KEY=…
AI_PROVIDER=openai
AI_API_KEY=…`}
              </pre>
            </div>
          </Card>

          {/* -------------------- Data management -------------------- */}
          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
              <Globe className="size-4 text-brand-500" aria-hidden />
              Your data
            </h2>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-200 px-3.5 py-3">
                <div>
                  <p className="text-[13.5px] font-medium text-ink-800">Outreach templates</p>
                  <p className="text-[12.5px] text-ink-500">Restore the built-in templates and discard your edits.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={resetTemplates}>
                  <RotateCcw />
                  Restore defaults
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-200 px-3.5 py-3">
                <div>
                  <p className="text-[13.5px] font-medium text-ink-800">Search history</p>
                  <p className="text-[12.5px] text-ink-500">
                    {history.length ? `${history.length} recent searches stored on this device.` : "Nothing stored yet."}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={clearHistory} disabled={!history.length}>
                  <Trash2 />
                  Clear history
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-200 px-3.5 py-3">
                <div>
                  <p className="text-[13.5px] font-medium text-ink-800">Saved leads</p>
                  <p className="text-[12.5px] text-ink-500">
                    {leads.length ? `${leads.length} saved. Manage them from the Saved screen.` : "No saved leads yet."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/saved">Manage</Link>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={!leads.length}
                    onClick={() => leads.forEach((lead) => removeLead(lead.businessId))}
                  >
                    <Trash2 />
                    Delete all
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <InfoNote tone="info" icon={<Info className="size-4" />} title="Privacy and safety">
            {MESSAGING.noAutoSendBody} {MESSAGING.demoDataBody}
          </InfoNote>

          <p className="pb-2 text-center text-[11.5px] text-ink-400">
            {APP.name} · {APP.version}
          </p>
        </div>
      </div>
    </>
  );
}
