import { PageLoader } from "@/components/PageLoader";
import { List as RequestAccessTileList } from "@/components/RequestAccessTile/List";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useGetRequestCatalogApplications } from "@/hooks/api/useApplications";
import { useCurrentUser } from "@/contexts/UserContext";
import { Box, Grid, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/request-access/")({
  component: RequestAccess,
});

function RequestAccess() {
  const { data: applications = [], isPending } =
    useGetRequestCatalogApplications();
  const { isDstAdmin } = useCurrentUser();

  if (isPending) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <Typography variant="h2" fontWeight={"bold"}>
            Request Access
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Request access to EPIC applications based on your role and
            responsibilities.
          </Typography>
        </Grid>
        {!isDstAdmin && (<Grid item xs={12} mt="32px">
          <Typography variant="body1" fontWeight={"bold"}>
            You will receive an email when your request has been processed.
          </Typography>
        </Grid>)}
        {isDstAdmin && (
          <Grid item xs={12} mt="32px">
            <Box
              sx={{
                backgroundColor: "#FEF1D8",
                border: "1px solid #F8BB47",
                borderRadius: "4px",
                padding: "8px",
                maxWidth: "1060px",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: "16px",
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "27.008px",
                }}
              >
                As a EPIC.auth Superuser, you can assign yourself Access Levels for all the EPIC applications from your EPIC.auth user profile.
              </Typography>
            </Box>
          </Grid>
        )}
        {isDstAdmin && (
          <Grid item xs={12} mt="32px">
            <Box
              sx={{
                backgroundColor: "#FEF1D8",
                border: "1px solid #F8BB47",
                borderRadius: "4px",
                padding: "8px",
                maxWidth: "1060px",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: "16px",
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "27.008px",
                }}
              >
                As a EPIC.auth Superuser, you can assign yourself Access Levels for all the EPIC applications from your EPIC.auth user profile.
              </Typography>
            </Box>
          </Grid>
        )}
        <Grid container item xs={12} mt="32px">
          <RequestAccessTileList items={applications} />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
