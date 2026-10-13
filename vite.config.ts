import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import { verifyReleaseAssets } from "./scripts/release-assets.mjs";

export default defineConfig({
  root: "apps/web",
  envDir: "../..",
  plugins: [
    {
      name: "human-asset-approval",
      apply: "build",
      async buildStart() {
        if (process.env.VITE_DEMO_MODE !== "true") await verifyReleaseAssets();
      },
    },
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2}", "icons/*.png", "brand.svg", "images/google-signin/*.{png,ttf}"],
        globIgnores: ["content/**"],
      },
      manifest: {
        id: "/",
        name: "キッズ塗り絵アイランド",
        short_name: "ぬりえアイランド",
        description: "きみだけの色で、せかいをつくろう",
        lang: "ja",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        theme_color: "#e6f8fc",
        background_color: "#f6fcfd",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@island/shared": fileURLToPath(
        new URL("./packages/shared-types/src/index.ts", import.meta.url),
      ),
      "@island/content": fileURLToPath(
        new URL("./packages/content-schema/src/index.ts", import.meta.url),
      ),
      "@island/engine": fileURLToPath(
        new URL("./packages/coloring-engine/src/index.ts", import.meta.url),
      ),
      "@island/persistence": fileURLToPath(
        new URL("./packages/persistence/src/index.ts", import.meta.url),
      ),
    },
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
  },
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
