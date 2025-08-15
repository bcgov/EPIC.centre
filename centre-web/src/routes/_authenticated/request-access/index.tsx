import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/request-access/")({
  component: RequestAccess,
});

function RequestAccess() {
  return (
    <PageGrid>
      <Grid item>Hello /_authenticated/launchpad/request-access/!</Grid>
    </PageGrid>
  );
}
