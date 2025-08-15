import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  return (
    <PageGrid>
      <Grid item>Hello /_authenticated/launchpad/!</Grid>
    </PageGrid>
  );
}
