import { DocumentSearch } from "@/components/DocumentSearch";
import { AIDocumentSearch } from "@/components/AIDocumentSearch";
import { List as EpicTileList } from "@/components/LaunchAppTile/List";
import { LaunchAppListSkeleton } from "@/components/LaunchAppTile/ListSkeleton";
import { ViewDescriptionSwitch } from "@/components/LaunchAppTile/ViewDescriptionSwitch";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useGetApplications } from "@/hooks/api/useApplications";
import { EpicAppName } from "@/models/EpicApp";
import { Box } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCurrentUser } from "@/contexts/UserContext";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  const { isAISearchUser } = useCurrentUser();

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
    <PageContainer
      sx={{
        padding: "10px 24px 36px 24px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
          maxWidth: "1070px",
        }}
      >
        <ViewDescriptionSwitch />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >

        {isAISearchUser && <AIDocumentSearch />}
        <DocumentSearch epicApp={documentSearchApp} />
        <EpicTileList items={otherApps} />
      </Box>
    </PageContainer>
  );
}
