import type { ModuleFederationRuntimePlugin } from "@module-federation/runtime/types";
import { AppConfig } from "@/utils/config";

/** Points the `epicMap` remote at this environment's map (VITE_MAP_WIDGET_URL). */
const remoteEntryUrl = (): ModuleFederationRuntimePlugin => ({
  name: "epic-map-remote-entry-url",

  beforeRequest(args) {
    // The plugin registers the remote under a generated name, aliased "epicMap".
    const remote = args.options.remotes.find(
      (candidate) =>
        candidate.alias === "epicMap" || candidate.name === "epicMap",
    );

    if (remote && "entry" in remote) {
      remote.entry = AppConfig.mapWidgetEntry;
    }

    return args;
  },
});

export default remoteEntryUrl;
