import { DocumentSearch } from "@/components/DocumentSearch";
import { List as EpicTileList } from "@/components/LaunchAppTile/List";
import { LaunchAppListSkeleton } from "@/components/LaunchAppTile/ListSkeleton";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useGetApplications } from "@/hooks/api/useApplications";
import { EpicAppName } from "@/models/EpicApp";
import { Box } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  const { data: applications = [], isPending } = useGetApplications();
  console.log("A", applications);

  const { documentSearchApp, otherApps } = useMemo(() => {
    const documentSearchApp = applications.find(
      (app) => app.name === EpicAppName.DOCUMENT_SEARCH,
    );
    const otherApps = applications.filter(
      (app) => app.name !== EpicAppName.DOCUMENT_SEARCH,
    );
    return { documentSearchApp, otherApps };
  }, [applications]);

  console.log("B", otherApps);

  if (isPending) {
    return <LaunchAppListSkeleton />;
  }

  return (
    <PageContainer>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <DocumentSearch epicApp={documentSearchApp} />
        <EpicTileList items={otherApps} />
      </Box>
    </PageContainer>
  );
}
