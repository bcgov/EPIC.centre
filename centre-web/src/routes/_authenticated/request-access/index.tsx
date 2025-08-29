import { PageLoader } from "@/components/PageLoader";
import { List as RequestAccessTileList } from "@/components/RequestAccessTile/List";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useGetRequestCatalogApplications } from "@/hooks/api/useApplications";
import { Grid, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/request-access/")({
  component: RequestAccess,
});

function RequestAccess() {
  const { data: applications = [], isPending } =
    useGetRequestCatalogApplications();

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
        <Grid item xs={12} mt="32px">
          <Typography variant="body1">
            You will receive an email when your request has been processed.
          </Typography>
        </Grid>
        <Grid container item xs={12} mt="32px">
          <RequestAccessTileList items={applications} />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
