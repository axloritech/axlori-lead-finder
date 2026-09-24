import {
  Bookmark,
  Filter,
  Home,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  FileText,
  Save,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Match child routes too (e.g. /business/* belongs to Leads). */
  matchPrefixes?: string[];
}

export const PRIMARY_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Start a new search",
    icon: Home,
  },
  {
    href: "/find",
    label: "Find Businesses",
    description: "Browse and filter your prospect list",
    icon: Search,
    matchPrefixes: ["/find", "/business"],
  },
  {
    href: "/saved",
    label: "Saved Leads",
    description: "Businesses you kept",
    icon: Bookmark,
    matchPrefixes: ["/saved"],
  },
  {
    href: "/templates",
    label: "Outreach Templates",
    description: "Manage your messages",
    icon: FileText,
  },
  {
    href: "/insights",
    label: "AI Insights",
    description: "Opportunities ranked for you",
    icon: Sparkles,
  },
  {
    href: "/summary",
    label: "Business Summary",
    description: "Search statistics and breakdowns",
    icon: LayoutDashboard,
    matchPrefixes: ["/summary"],
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Profile, data sources, defaults",
    icon: Settings,
  },
];

/** Bottom navigation on phones: Home · Leads · Saved · More */
export const MOBILE_PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/find", label: "Leads", icon: Search, matchPrefixes: ["/find", "/business"] },
  { href: "/saved", label: "Saved", icon: Bookmark, matchPrefixes: ["/saved"] },
  { href: "/more", label: "More", icon: Filter, matchPrefixes: ["/more", "/templates", "/insights", "/summary", "/settings", "/filters"] },
];

export const MORE_NAV: NavItem[] = [
  { href: "/filters", label: "Filters", description: "Refine the current search", icon: Filter },
  { href: "/insights", label: "AI Insights", description: "Opportunities across your search", icon: Sparkles },
  { href: "/templates", label: "Outreach Templates", description: "Edit and reuse messages", icon: FileText },
  { href: "/summary", label: "Business Summary", description: "Statistics and top categories", icon: LayoutDashboard },
  { href: "/saved", label: "Saved Leads", description: "Everything you kept", icon: Save },
  { href: "/settings", label: "Settings", description: "Profile and data sources", icon: Settings },
];

export function isActivePath(pathname: string, item: NavItem) {
  if (item.href === "/") return pathname === "/";
  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
