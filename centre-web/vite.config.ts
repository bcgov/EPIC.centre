import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import istanbul from "vite-plugin-istanbul";
import { federation } from "@module-federation/vite";
// Verbatim copy of EPIC.map/packages/epic-map/federation.shared.mjs; keep it identical.
import { sharedModules } from "./federation.shared.mjs";

// Placeholders: src/federation/remoteEntryUrl.ts sets the real entry at runtime.
// Builds use a relative one so no localhost URL ships.
const WIDGET_DEV_ENTRY = "http://127.0.0.1:5174/remoteEntry.js";
const WIDGET_BUILD_ENTRY = "/epic-map-remote-entry-set-at-runtime.js";

// https://vitejs.dev/config/

export default defineConfig(({ command }) => ({
  plugins: [
    TanStackRouterVite(),
    react(),
    istanbul({
      cypress: true,
      requireEnv: false,
    }),
    federation({
      name: "epicCentre",
      remotes: {
        epicMap: {
          type: "module",
          name: "epicMap",
          entry: command === "build" ? WIDGET_BUILD_ENTRY : WIDGET_DEV_ENTRY,
        },
      },
      shared: sharedModules,
      // Fetch the map only when it renders, and keep Centre's own versions of
      // shared modules. The default (version-first) loaded the map at startup.
      shareStrategy: "loaded-first",
      runtimePlugins: ["./src/federation/remoteEntryUrl.ts"],
      // Types are vendored in src/types; don't fetch them from the remote.
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
    // One copy of each singleton, or the remote is offered a second one.
    dedupe: [
      "react",
      "react-dom",
      "@emotion/react",
      "@emotion/styled",
      "@mui/material",
    ],
  },
  build: {
    // Federation's generated entry uses top-level await.
    target: "chrome89",
  },
}));
