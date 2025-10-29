import { DocumentSearch } from "@/components/DocumentSearch";
import { List as EpicTileList } from "@/components/LaunchAppTile/List";
import { LaunchAppListSkeleton } from "@/components/LaunchAppTile/ListSkeleton";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useGetApplications } from "@/hooks/api/useApplications";
import { useGetUserSettings, useUpdateSettings } from "@/hooks/api/useUserSettings";
import { EpicAppName } from "@/models/EpicApp";
import { Box, Switch, FormControlLabel } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  const { data: applications = [], isPending } = useGetApplications();
  const { data: userSettings } = useGetUserSettings();
  const updateSettings = useUpdateSettings();

  // Initialize showDescription from user settings, default to true
  const [showDescription, setShowDescription] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState<string>("");

  // Load preference from user settings on mount
  useEffect(() => {
    if (userSettings?.settings?.showDescription !== undefined) {
      setShowDescription(userSettings.settings.showDescription);
    }
  }, [userSettings]);

  // Clear announcement after it's been announced
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  // Save preference when it changes
  const handleToggleChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setShowDescription(checked);
    setAnnouncement(checked ? "Application descriptions visible" : "Application descriptions hidden");

    // Save to user settings
    const newSettings = {
      ...userSettings?.settings,
      showDescription: checked,
    };

    // Silently fail if save doesn't work - toggle still works for session
    updateSettings.mutate(newSettings, {
      onError: () => {
        // Silently fail - toggle still works for current session
      },
    });
  }, [userSettings, updateSettings]);

  const { documentSearchApp, otherApps } = useMemo(() => {
    const documentSearchApp = applications.find(
      (app) => app.name === EpicAppName.DOCUMENT_SEARCH,
    );
    const otherApps = applications.filter(
      (app) => app.name !== EpicAppName.DOCUMENT_SEARCH,
    );
    return { documentSearchApp, otherApps };
  }, [applications]);

  if (isPending) {
    return <LaunchAppListSkeleton />;
  }

  return (
    <PageContainer>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
          maxWidth: "1070px",
        }}
      >
        <FormControlLabel
          control={
            <Switch checked={showDescription} onChange={handleToggleChange} name="view-description"
              sx={{
                '& .MuiSwitch-thumb': {
                  backgroundColor: '#ffffff',
                  border: `1px solid ${BCDesignTokens.themeGray50}`, 
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#e6e3e3',
                  opacity: 1,
                },
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#ffffff',        
                  '& .MuiSwitch-thumb': {
                    backgroundColor: '#ffffff',
                    border: 'none',
                  },
                  '& + .MuiSwitch-track': {
                    backgroundColor: BCDesignTokens.themeBlue90,  
                    opacity: 1,
                  },
                },
              }}

            />
          }
          label="View Description"
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <DocumentSearch epicApp={documentSearchApp} />
        <EpicTileList items={otherApps} showDescription={showDescription} />
      </Box>
    </PageContainer>
  );
}
