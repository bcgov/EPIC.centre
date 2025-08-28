import { DocumentSearch } from "@/components/DocumentSearch";
import { List as EpicTileList } from "@/components/LaunchAppTile/List";
import { LaunchAppListSkeleton } from "@/components/LaunchAppTile/ListSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { useGetApplications } from "@/hooks/api/useApplications";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  const DOCUMENT_SEARCH_APP_ID = 7;
  const { data: applications = [], isPending } = useGetApplications();

  const { documentSearchApp, otherApps } = useMemo(() => {
    const documentSearchApp = applications.find(
      (app) => app.id === DOCUMENT_SEARCH_APP_ID,
    );
    const otherApps = applications.filter(
      (app) => app.id !== DOCUMENT_SEARCH_APP_ID,
    );
    return { documentSearchApp, otherApps };
  }, [applications]);

  if (isPending) {
    return <LaunchAppListSkeleton />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <DocumentSearch epicApp={documentSearchApp} />
      </Grid>
      <Grid item xs={12}>
        <EpicTileList items={otherApps} />
      </Grid>
    </PageGrid>
  );
}
