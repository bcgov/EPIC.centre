import { Grid } from "@mui/material";
import { LaunchAppTileSkeleton } from "./TileSkeleton";
import { DocumentSearchSkeleton } from "../DocumentSearch/Skeleton";
import { PageGrid } from "../Shared/PageGrid";

export const LaunchAppListSkeleton = ({ count = 10 }: { count?: number }) => {
  return (
    <PageGrid>
      <Grid item xs={12}>
        <DocumentSearchSkeleton />
      </Grid>
      {Array.from({ length: count }).map((_, idx) => (
        <Grid item key={idx}>
          <LaunchAppTileSkeleton />
        </Grid>
      ))}
    </PageGrid>
  );
};
