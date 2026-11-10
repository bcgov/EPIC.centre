/**
 * Modules the host and this remote must agree on rather than each shipping their
 * own copy.
 *
 * Module Federation negotiates these at load time: the host offers what it has,
 * the remote offers what it has, and the highest version that satisfies both
 * sides wins. A module only one side declares is not shared at all - it is
 * quietly loaded twice.
 *
 * `singleton` is not an optimisation here, it is a correctness requirement.
 * React throws "invalid hook call" the moment two copies are live, and every
 * context that has to cross the host/remote seam - emotion's cache, MUI's theme -
 * is identity-compared against the module that created it. A second copy of any
 * of these renders an unthemed map at best.
 *
 * `strictVersion` is deliberately left off (it defaults to false), so a host on
 * MUI 5.15.19 against our 5.15.20 gets a warning and a working map rather than a
 * hard failure. The versions below are the floors this widget is written
 * against, not pins.
 *
 * Deliberately NOT shared:
 *   maplibre-gl - 800kB no host has a use for, and sharing it would let a host's
 *     copy win the negotiation, which moves `import.meta.url` to the host's
 *     origin and leaves the web worker behind (see maplibreWorkerAssets in
 *     vite.config.ts).
 *   axios - the widget's client is private, interceptors and all, and a shared
 *     copy buys nothing but a way for a host's interceptors to see our tokens.
 *   @mui/icons-material - a shared module is provided whole, so sharing the icon
 *     barrel means shipping all ~11,000 of them: 4.3MB of chunk for the dozen
 *     this widget draws. Icons hold no state and cross no context - they are
 *     plain components over @mui/material's createSvgIcon, which IS shared - so
 *     leaving them out costs nothing and lets tree-shaking do its job.
 *
 * This is a plain .mjs rather than TypeScript because scripts/check-shared-modules.mjs
 * imports it directly, alongside each host's copy, to check that the lists still
 * agree. Nothing else would catch a disagreement: the two are built separately
 * and never see each other until a browser loads both.
 *
 * A host in another repository copies this file. It is the map's integration
 * contract as much as @bcgov/epic-map-types is.
 */
export const sharedModules = {
  react: { singleton: true, requiredVersion: "^18.2.0" },
  // Shared even though the map imports no react-dom of its own. The copy of MUI
  // it would fall back to does, so a host that ever loses the MUI negotiation
  // would otherwise put a second renderer in the page.
  //
  // The cost is a dev-only console warning in the host - "You are importing
  // createRoot from react-dom" - which is a Vite-optimizer/federation
  // interaction, not a wrong import, and is absent from production builds. See
  // map-web/README.md, "A console warning you will see in dev".
  "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
  // The automatic JSX transform imports this directly. Left out, it is bundled
  // separately from `react` and becomes the duplicate-React failure all over
  // again, with nothing in the import graph to suggest why.
  "react/jsx-runtime": { singleton: true, requiredVersion: "^18.2.0" },
  "@emotion/react": { singleton: true, requiredVersion: "^11.11.4" },
  "@emotion/styled": { singleton: true, requiredVersion: "^11.11.5" },
  "@mui/material": { singleton: true, requiredVersion: "^5.15.20" },
  // Shared, but never a singleton: the widget mounts its own
  // QueryClientProvider, so no context crosses the seam. A host on v4 keeps its
  // v4 and the widget gets its own v5, instead of silently running on an API it
  // was not written for.
  "@tanstack/react-query": { singleton: false, requiredVersion: "^5.45.1" },
};

export default sharedModules;
