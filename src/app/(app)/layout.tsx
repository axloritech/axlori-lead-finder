import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileBottomNav, APP_SHELL_PADDING } from "@/components/mobile-bottom-nav";
import { cn } from "@/lib/utils";

/**
 * Application shell.
 *
 * Desktop: fixed sidebar + spacious content area.
 * Mobile: full-width content with a fixed bottom navigation bar, padded so
 * nothing is ever hidden behind it. Content never scrolls sideways.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-brand-50">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className={cn("min-w-0 flex-1", APP_SHELL_PADDING)}>
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
