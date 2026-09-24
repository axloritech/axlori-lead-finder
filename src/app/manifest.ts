import type { MetadataRoute } from "next";
import { APP } from "@/lib/constants";

/** PWA manifest. Installable on mobile; works offline for the shell. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP.name} — ${APP.tagline}`,
    short_name: APP.shortName,
    description: APP.description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f2f7ff",
    theme_color: "#f2f7ff",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
