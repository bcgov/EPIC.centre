import { useCallback } from "react";
import { Box } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import MapWidgetRemote from "@/components/Map/MapWidgetRemote";
import PageNotFound from "@/components/Shared/PageNotFound";
import { useCurrentUser } from "@/contexts/UserContext";
import { AppConfig } from "@/utils/config";

export const Route = createFileRoute("/_authenticated/map")({
  component: MapPage,
});

function MapPage() {
  const { user } = useAuth();
  const { canViewMap } = useCurrentUser();

  const getAccessToken = useCallback(async () => {
    const token = user?.access_token;
    if (!token) {
      throw new Error("No access token in the host session");
    }
    return token;
  }, [user]);

  if (!AppConfig.mapEnabled) {
    return <PageNotFound />;
  }

  if (!canViewMap) {
    return <Navigate to="/access-denied" />;
  }

  // The widget fills its container; match the side nav's height.
  return (
    <Box sx={{ flex: 1, minWidth: 0, height: "calc(100vh - 88px)" }}>
      <MapWidgetRemote
        apiBaseUrl={AppConfig.mapApiUrl}
        getAccessToken={getAccessToken}
      />
    </Box>
  );
}
