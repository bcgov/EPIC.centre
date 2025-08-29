import { DocumentSearch } from "@/components/DocumentSearch";
import { List as EpicTileList } from "@/components/LaunchAppTile/List";
import { LaunchAppListSkeleton } from "@/components/LaunchAppTile/ListSkeleton";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useGetApplications } from "@/hooks/api/useApplications";
import { EpicAppName } from "@/models/EpicApp";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  const { data: applications = [], isPending } = useGetApplications();

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
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DocumentSearch epicApp={documentSearchApp} />
        </Grid>
        <Grid item xs={12}>
          <EpicTileList items={otherApps} />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
