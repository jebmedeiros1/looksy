import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Looksy",
    short_name: "Looksy",
    description: "Componha looks com consciencia usando o guarda-roupa que voce ja tem.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf5ff",
    theme_color: "#7c3aed",
    orientation: "portrait",
    categories: ["lifestyle", "fashion", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
