import { AllUsers } from "@/components/AuthManagement/AllUsers";
import { NewRequests } from "@/components/AuthManagement/NewRequests";
import {
  CentreTab,
  CentreTabs,
} from "@/components/Shared/CentreTabs/CentreTab";
import { CentreTabPanel } from "@/components/Shared/CentreTabs/CentreTabPanel";
import { PageContainer } from "@/components/Shared/PageGrid";
import { Box, Grid, Paper, Tabs, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/request-access/auth/")({
  component: AuthRequestAccess,
});

function AuthRequestAccess() {
  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper elevation={1}>
            <Box
              sx={{
                padding: "12px 24px",
              }}
            >
              <Typography variant="h3" fontWeight={"bold"}>
                EPIC.auth
              </Typography>
            </Box>
            <Box
              sx={{
                padding: "12px",
              }}
            >
              <Box
                sx={{
                  padding: "16px",
                  border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                }}
              >
                <CentreTabs
                  value={value}
                  onChange={handleChange}
                  TabIndicatorProps={{ sx: { display: "none" } }}
                >
                  <CentreTab
                    label="New Access Requests"
                    sx={{
                      width: "205px",
                    }}
                  />
                  <CentreTab
                    label="All Users"
                    sx={{
                      width: "105px",
                    }}
                  />
                </CentreTabs>
                <CentreTabPanel value={value} index={0}>
                  <NewRequests />
                </CentreTabPanel>
                <CentreTabPanel value={value} index={1}>
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
