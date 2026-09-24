import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AppProvider } from "@/components/providers/app-provider";
import { getProviderMetaSummary } from "@/lib/services";
import { APP } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP.name} — ${APP.tagline}`,
    template: `%s · ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP.shortName,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: true, address: false, email: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    title: `${APP.name} — ${APP.tagline}`,
    description: APP.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f7ff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved on the server: exposes provider labels and status only — never keys.
  const { config, providers } = getProviderMetaSummary();

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-brand-50 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <AppProvider initialRuntime={{ config, providers }}>{children}</AppProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-2xl !border-ink-200 !bg-white !text-ink-800 !shadow-[var(--shadow-raised)]",
              description: "!text-ink-500",
            },
          }}
        />
      </body>
    </html>
  );
}
