import { DocumentSearch } from "@/components/DocumentSearch";
import { List as EpicTileList } from "@/components/LaunchAppTile/List";
import { LaunchAppListSkeleton } from "@/components/LaunchAppTile/ListSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { useGetApplications } from "@/hooks/api/useApplications";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  const { data: applications, isPending } = useGetApplications();

  if (isPending) {
    return <LaunchAppListSkeleton />;
  }

  return (
    <PageGrid>
      <Grid xs={12} item>
        <DocumentSearch />
      </Grid>
      <Grid item xs={12}>
        <EpicTileList items={applications ?? []} />
      </Grid>
    </PageGrid>
  );
}
