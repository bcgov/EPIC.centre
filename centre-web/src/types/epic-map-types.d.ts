// Public contract of the EPIC map federated remote.
//
// Types only: nothing here emits a byte of JavaScript. The remote is loaded at
// runtime over Module Federation, so a host has no import to infer types from —
// it points a module declaration at this file instead:
//
//   declare module "epicMap/MapWidget" {
//     export { MapWidget } from "@bcgov/epic-map-types";
//   }
//
// This is the canonical definition. Inside this repository the widget and
// map-web resolve it as a workspace package; packages/epic-map/src/types.ts
// re-exports it, so a prop removed here fails the widget's own typecheck.
//
// Outside this repository it is not installed from anywhere. The build copies
// it into the remote's output, so every deployment serves the contract it was
// built from at /epic-map.d.ts, and a host vendors that file and diffs it
// against the environment it loads the map from. See
// packages/epic-map/README.md, "Types for a host outside this repository".

import type { Geometry } from "geojson";
import type { ReactElement } from "react";

/** A feature the user selected on the map. */
export interface MapFeature {
  /** Stable identifier for the feature, as returned by the API. */
  id: string;
  /** Identifier of the map layer the feature came from. */
  layerId?: string;
  /** GeoJSON geometry in WGS84 (EPSG:4326). */
  geometry: Geometry;
  /** Feature attributes, passed through from the API unmodified. */
  properties: Record<string, unknown>;
}

/**
 * Coarse classification of a failure, so a host can decide what to do without
 * unwrapping an axios error. `auth` means the host's session could not produce a
 * token the API would accept — the host owns the session, so the host decides
 * whether that means a re-login prompt.
 */
export type MapWidgetErrorKind =
  | "auth"
  | "network"
  | "request"
  | "server"
  | "unknown";

/** An error surfaced to the host through `onError`. */
export interface MapWidgetError {
  kind: MapWidgetErrorKind;
  /** Human-readable summary. Not intended for display to end users as-is. */
  message: string;
  /** HTTP status, when the failure came from a response. */
  status?: number;
  /** The underlying error, for logging. Shape is not part of the contract. */
  cause?: unknown;
}

/**
 * Bounding box as `[west, south, east, north]` in WGS84 (EPSG:4326) degrees.
 */
export type MapExtent = [number, number, number, number];

/**
 * Style URLs for the basemaps behind the map's basemap switch.
 *
 * Each is a URL to a Style Spec v8 document. Omit one and the widget's own
 * default stands: BC Basemap for `standard`, Esri World Imagery for `satellite`.
 *
 * This exists because the widget's defaults are services it does not own. BC
 * Basemap's URLs are published as subject to change, and its "Access Only"
 * licence is a decision for whoever deploys the application - not one this
 * package should make on their behalf.
 */
export interface MapBasemapStyles {
  standard?: string;
  satellite?: string;
}

export interface MapWidgetProps {
  /** Base URL of the EPIC.map API, including the `/api` prefix. */
  apiBaseUrl: string;

  /**
   * Supplies a bearer token for API calls.
   *
   * This is the ONLY way a token enters the widget. The widget never reads
   * `sessionStorage`, `localStorage` or cookies, and never constructs a Keycloak
   * or OIDC client — the host already has a session and the widget borrows the
   * token from it.
   *
   * Called before every request, and once more if a request comes back 401, so
   * an implementation that refreshes on demand works without extra wiring. It
   * may reject; the failure is reported through `onError` as `kind: "auth"`.
   */
  getAccessToken: () => Promise<string>;

  /** Restrict the map to a single project. */
  projectId?: string;

  /** Initial viewport, as `[west, south, east, north]`. */
  initialExtent?: MapExtent;

  /** Replace the style behind either basemap. See {@link MapBasemapStyles}. */
  basemapStyles?: MapBasemapStyles;

  /**
   * Height of the widget's root element. A number is treated as pixels; a string
   * is used verbatim. Defaults to `"100%"`, which fills the host's container —
   * prefer sizing the container over passing a fixed height.
   */
  height?: string | number;

  /** Called when the user selects a feature. */
  onFeatureSelect?: (feature: MapFeature) => void;

  /**
   * Called when the widget fails. The widget never redirects and never renders a
   * full-page error — a host tab keeps its state, and the host decides what the
   * user sees.
   */
  onError?: (error: MapWidgetError) => void;
}

/**
 * The embeddable EPIC map, as the `epicMap/MapWidget` remote module exports it.
 *
 * Declared here so a host can name the type of something it never imports. The
 * remote module also default-exports the same component, which is what
 * `React.lazy` wants.
 */
export declare const MapWidget: (props: MapWidgetProps) => ReactElement;

export default MapWidget;
