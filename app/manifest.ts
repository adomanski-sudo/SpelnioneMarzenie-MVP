import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpełnioneMarzenie.pl",
    short_name: "Marzenia",
    description: "Zarządzaj swoimi marzeniami i spełniaj marzenia znajomych",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f5f9",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}