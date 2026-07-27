import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Fully static for now -- every page below is prerendered at build time, so
// no platform-specific adapter is needed (Cloudflare Pages, or any static
// host, just serves the dist/ output directly). Once state/city/category
// pages are backed by Supabase and grow past what's worth prebuilding,
// switch output to "server", add @astrojs/cloudflare as the adapter, and set
// `prerender = true` only on the pages that should stay static (homepage,
// legal pages).
export default defineConfig({
  site: "https://spedcentral.com",
  output: "static",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
