import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { useAuth } from "react-oidc-context";

import { AllUsers } from "@/components/AuthManagement/AllUsers";
import { NewRequests } from "@/components/AuthManagement/NewRequests";
import {
  CentreTab,
  CentreTabs,
} from "@/components/Shared/CentreTabs/CentreTab";
import { CentreTabPanel } from "@/components/Shared/CentreTabs/CentreTabPanel";
import { PageContainer } from "@/components/Shared/PageGrid";
import { BCDesignTokens } from "epic.theme";
import { isAdministrator } from "@/utils/roleUtils";

export const Route = createFileRoute("/_authenticated/request-access/auth/")({
  component: AuthRequestAccess,
});

function AuthRequestAccess() {
  const { user } = useAuth();
  const TAB_HASHES = ["new-requests", "all-users"] as const;

  function getTabIndexFromHash(hash: string): number {
    const cleanHash = hash.replace("#", "");
    const idx = TAB_HASHES.indexOf(cleanHash as (typeof TAB_HASHES)[number]);
    return idx === -1 ? 0 : idx;
  }
  
  const [tabIndex, setTabIndex] = useState(() =>
    getTabIndexFromHash(window.location.hash),
  );

  // Check if user has Administrator role
  if (!isAdministrator(user?.access_token)) {
    return <Navigate to="/access-denied" />;
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    window.location.hash = TAB_HASHES[newValue];
  };

  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper elevation={3}>
            <Box
              sx={{
                padding: "12px 24px",
                borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              }}
            >
              <Typography variant="h3" fontWeight="bold">
                EPIC.auth
              </Typography>
            </Box>

            <Box sx={{ padding: 2 }}>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                }}
              >
                <CentreTabs
                  value={tabIndex}
                  onChange={handleTabChange}
                  TabIndicatorProps={{ sx: { display: "none" } }}
                >
                  <CentreTab label="New Access Requests" sx={{ width: 205 }} />
                  <CentreTab label="All Users" sx={{ width: 105 }} />
                </CentreTabs>

                <CentreTabPanel value={tabIndex} index={0}>
                  <NewRequests />
                </CentreTabPanel>
                <CentreTabPanel value={tabIndex} index={1}>
                  <AllUsers />
                </CentreTabPanel>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
