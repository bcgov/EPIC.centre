import { List as EpicTileList } from "@/components/LaunchAppTile/List";
import { PageGrid } from "@/components/Shared/PageGrid";
import { EpicApp } from "@/models/EpicApp";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/launchpad/")({
  component: Launchpad,
});

function Launchpad() {
  const mockEngageTile = {
    app_id: 1,
    name: "EPIC.engage",
    description: "Public Engagement Application",
    launch_url: "https://engage.eao.gov.bc.ca/",
    is_active: true,
    user: {
      access_level: "Super User",
      last_accessed: "2025-07-07",
      custom_order: 2,
      bookmarks: [
        {
          label: "Yellowhead",
          url: "https://engage.eao.gov.bc.ca/Yellowhead-EE",
        },
      ],
    },
  };
  const mockTiles: EpicApp[] = [
    mockEngageTile,
    {
      app_id: 2,
      name: "EPIC.submit",
      description: "Document submission Tool for Proponents and Holders",
      launch_url: "https://submit.eao.gov.bc.ca/",
      is_active: true,
      user: {
        access_level: null,
        last_accessed: null,
        custom_order: null,
        bookmarks: [],
      },
    },
  ];
  return (
    <PageGrid>
      <Grid item>
        <EpicTileList items={mockTiles} />
      </Grid>
    </PageGrid>
  );
}
