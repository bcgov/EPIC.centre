import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { MapWidgetProps } from "@bcgov/epic-map-types";

// Outside the component: a new lazy() per render would remount the map.
const MapWidget = lazy(() => import("epicMap/MapWidget"));

interface MapWidgetRemoteProps extends MapWidgetProps {
  /** Height of the loading and error states. */
  minHeight?: number | string;
}

const Centered = ({
  minHeight,
  children,
}: {
  minHeight: number | string;
  children: ReactNode;
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      minHeight,
      p: 3,
      textAlign: "center",
    }}
  >
    {children}
  </Box>
);

interface BoundaryProps {
  minHeight: number | string;
  children: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

/** Catches a remote that fails to load, so it can't unmount the rest of the app. */
class MapWidgetBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Failed to load the EPIC map remote", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    // Retry by reloading: federation caches a failed entry for the page's life.
    return (
      <Centered minHeight={this.props.minHeight}>
        <Typography variant="h6">The map could not be loaded</Typography>
        <Typography variant="body2" color="text.secondary">
          The map service did not respond. This is usually temporary.
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Centered>
    );
  }
}

/** The EPIC map, loaded at runtime over Module Federation. */
const MapWidgetRemote = ({ minHeight = 400, ...props }: MapWidgetRemoteProps) => (
  <MapWidgetBoundary minHeight={minHeight}>
    <Suspense
      fallback={
        <Centered minHeight={minHeight}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading the map…
          </Typography>
        </Centered>
      }
    >
      <MapWidget {...props} />
    </Suspense>
  </MapWidgetBoundary>
);

export default MapWidgetRemote;
