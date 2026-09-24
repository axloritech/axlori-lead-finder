"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { STORAGE_KEYS, MAX_SEARCH_HISTORY, DEFAULT_RADIUS } from "@/lib/constants";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toSavedLead } from "@/lib/leads";
import { BUILT_IN_TEMPLATES, DEFAULT_SENDER, type SenderProfile } from "@/lib/outreach/tokenise";
import type {
  Business,
  LeadStatus,
  OutreachChannel,
  OutreachTemplate,
  SavedLead,
  SearchQuery,
} from "@/lib/types";
import type { RuntimeConfig } from "@/lib/config";
import type { ProviderStatus } from "@/lib/providers";

/**
 * App-wide client state: saved leads, outreach templates, sender settings and
 * search history. Storage lives in localStorage for now; the shape mirrors what a
 * server-side store would return, so swapping in an API or database later is a
 * change to this file only.
 */

export interface AppSettings {
  sender: SenderProfile;
  defaultRadius: number;
  defaultLocation: string;
  distanceUnit: "mi" | "km";
  autoAnalyse: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  sender: DEFAULT_SENDER,
  defaultRadius: DEFAULT_RADIUS,
  defaultLocation: "",
  distanceUnit: "mi",
  autoAnalyse: true,
};

export interface SearchHistoryEntry {
  id: string;
  term: string;
  location: string;
  radiusMiles: number;
  resultCount: number;
  at: string;
}

interface AppContextValue {
  /* leads */
  leads: SavedLead[];
  leadsHydrated: boolean;
  isSaved: (businessId: string) => boolean;
  saveLead: (business: Business) => void;
  removeLead: (businessId: string) => void;
  toggleLead: (business: Business) => void;
  updateLead: (businessId: string, patch: Partial<SavedLead>) => void;
  updateLeadStatus: (businessId: string, status: LeadStatus) => void;
  markContacted: (businessId: string, channel: OutreachChannel) => void;

  /* templates */
  templates: OutreachTemplate[];
  templatesHydrated: boolean;
  saveTemplate: (template: OutreachTemplate) => void;
  deleteTemplate: (id: string) => void;
  resetTemplates: () => void;

  /* settings */
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;

  /* search history */
  history: SearchHistoryEntry[];
  addHistory: (query: SearchQuery, resultCount: number) => void;
  clearHistory: () => void;
  lastSearch: Partial<SearchQuery> | null;
  setLastSearch: (query: Partial<SearchQuery>) => void;

  /* runtime */
  runtime: { config: RuntimeConfig; providers: ProviderStatus[] } | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialRuntime = null,
}: {
  children: ReactNode;
  /** Provider status resolved on the server, so badges are correct on first paint. */
  initialRuntime?: AppContextValue["runtime"];
}) {
  const leadsStore = useLocalStorage<SavedLead[]>(STORAGE_KEYS.leads, []);
  const templatesStore = useLocalStorage<OutreachTemplate[]>(STORAGE_KEYS.templates, []);
  const settingsStore = useLocalStorage<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const historyStore = useLocalStorage<SearchHistoryEntry[]>(STORAGE_KEYS.searchHistory, []);
  const lastSearchStore = useLocalStorage<Partial<SearchQuery> | null>(STORAGE_KEYS.lastSearch, null);

  const leads = useMemo(() => leadsStore.value ?? [], [leadsStore.value]);

  /* ------------------------------------------------------------------ leads */

  const isSaved = useCallback(
    (businessId: string) => leads.some((l) => l.businessId === businessId),
    [leads],
  );

  const saveLead = useCallback(
    (business: Business) => {
      leadsStore.setValue((current) => {
        const list = current ?? [];
        if (list.some((l) => l.businessId === business.id)) return list;
        return [toSavedLead(business), ...list];
      });
      toast.success("Lead saved", { description: `${business.name} was added to your Leads.` });
    },
    [leadsStore],
  );

  const removeLead = useCallback(
    (businessId: string) => {
      leadsStore.setValue((current) => (current ?? []).filter((l) => l.businessId !== businessId));
      toast("Lead removed", { description: "The business was removed from your saved leads." });
    },
    [leadsStore],
  );

  const toggleLead = useCallback(
    (business: Business) => {
      if (isSaved(business.id)) removeLead(business.id);
      else saveLead(business);
    },
    [isSaved, removeLead, saveLead],
  );

  const updateLead = useCallback(
    (businessId: string, patch: Partial<SavedLead>) => {
      leadsStore.setValue((current) =>
        (current ?? []).map((l) => (l.businessId === businessId ? { ...l, ...patch } : l)),
      );
    },
    [leadsStore],
  );

  const updateLeadStatus = useCallback(
    (businessId: string, status: LeadStatus) => updateLead(businessId, { status }),
    [updateLead],
  );

  const markContacted = useCallback(
    (businessId: string, channel: OutreachChannel) => {
      const now = new Date().toISOString();
      leadsStore.setValue((current) => {
        const list = current ?? [];
        if (!list.some((l) => l.businessId === businessId)) return list;
        return list.map((l) =>
          l.businessId === businessId
            ? { ...l, lastContactedAt: now, contactChannel: channel, status: l.status === "new" ? "contacted" : l.status }
            : l,
        );
      });
    },
    [leadsStore],
  );

  /* -------------------------------------------------------------- templates */

  /** Built-in templates are always available; user copies override by id. */
  const templates = useMemo<OutreachTemplate[]>(() => {
    const overrides = new Map((templatesStore.value ?? []).map((t) => [t.id, t]));
    const merged = BUILT_IN_TEMPLATES.map((base) => {
      const override = overrides.get(base.id);
      return override ? { ...base, ...override, builtIn: true } : base;
    });
    const custom = (templatesStore.value ?? []).filter((t) => !t.builtIn || !BUILT_IN_TEMPLATES.some((b) => b.id === t.id));
    return [...merged, ...custom];
  }, [templatesStore.value]);

  const saveTemplate = useCallback(
    (template: OutreachTemplate) => {
      templatesStore.setValue((current) => {
        const list = current ?? [];
        const exists = list.some((t) => t.id === template.id);
        const next = exists ? list.map((t) => (t.id === template.id ? template : t)) : [...list, template];
        return next;
      });
      toast.success("Template saved", { description: `“${template.name}” has been updated.` });
    },
    [templatesStore],
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      templatesStore.setValue((current) => (current ?? []).filter((t) => t.id !== id));
      toast("Template deleted");
    },
    [templatesStore],
  );

  const resetTemplates = useCallback(() => {
    templatesStore.setValue([]);
    toast.success("Templates restored to defaults");
  }, [templatesStore]);

  /* --------------------------------------------------------------- settings */

  const settings = useMemo<AppSettings>(
    () => ({ ...DEFAULT_SETTINGS, ...(settingsStore.value ?? {}) }),
    [settingsStore.value],
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => settingsStore.setValue((current) => ({ ...DEFAULT_SETTINGS, ...current, ...patch })),
    [settingsStore],
  );

  /* ------------------------------------------------------------- history */

  const history = useMemo(() => historyStore.value ?? [], [historyStore.value]);

  const addHistory = useCallback(
    (query: SearchQuery, resultCount: number) => {
      historyStore.setValue((current) => {
        const list = current ?? [];
        const entry: SearchHistoryEntry = {
          id: `${query.term}-${query.location}`.toLowerCase().replace(/\s+/g, "-"),
          term: query.term,
          location: query.location,
          radiusMiles: query.radiusMiles,
          resultCount,
          at: new Date().toISOString(),
        };
        return [entry, ...list.filter((h) => h.id !== entry.id)].slice(0, MAX_SEARCH_HISTORY);
      });
    },
    [historyStore],
  );

  const clearHistory = useCallback(() => historyStore.setValue([]), [historyStore]);

  const setLastSearch = useCallback(
    (query: Partial<SearchQuery>) => lastSearchStore.setValue(query),
    [lastSearchStore],
  );

  /* -------------------------------------------------------- provider status */

  const [runtime, setRuntime] = useState<AppContextValue["runtime"]>(initialRuntime);

  useEffect(() => {
    // The server already told us which providers are active; only ask again if it
    // could not (keeps provider state accurate without a redundant round trip).
    if (initialRuntime) return;
    let cancelled = false;
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.ok) {
          setRuntime({ config: data.config as RuntimeConfig, providers: (data.providers ?? []) as ProviderStatus[] });
        }
      })
      .catch(() => {
        /* Non-critical: the Settings screen shows a fallback when this fails. */
      });
    return () => {
      cancelled = true;
    };
  }, [initialRuntime]);

  const value = useMemo<AppContextValue>(
    () => ({
      leads,
      leadsHydrated: leadsStore.hydrated,
      isSaved,
      saveLead,
      removeLead,
      toggleLead,
      updateLead,
      updateLeadStatus,
      markContacted,
      templates,
      templatesHydrated: templatesStore.hydrated,
      saveTemplate,
      deleteTemplate,
      resetTemplates,
      settings,
      updateSettings,
      history,
      addHistory,
      clearHistory,
      lastSearch: lastSearchStore.value,
      setLastSearch,
      runtime,
    }),
    [
      leads,
      leadsStore.hydrated,
      isSaved,
      saveLead,
      removeLead,
      toggleLead,
      updateLead,
      updateLeadStatus,
      markContacted,
      templates,
      templatesStore.hydrated,
      saveTemplate,
      deleteTemplate,
      resetTemplates,
      settings,
      updateSettings,
      history,
      addHistory,
      clearHistory,
      lastSearchStore.value,
      setLastSearch,
      runtime,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>");
  return context;
}
