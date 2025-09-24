import { Box, Grid, Skeleton, Stack } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const UserAccessSkeleton = () => {
  return (
    <Box
      sx={{
        padding: "16px",
        border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
      }}
    >
      <Grid container alignItems="flex-start" spacing={3}>
        <Grid
          item
          xs={12}
          container
          justifyContent="space-between"
          alignItems="center"
        >
          <Grid item>
            <Skeleton variant="text" width={180} height={40} />
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={2}>
              <Skeleton variant="text" width={60} />
              <Skeleton variant="rectangular" width={80} height={28} />
            </Stack>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Skeleton variant="text" width={200} height={30} />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={150}
            sx={{ mt: 2 }}
          />
        </Grid>

        <Grid item xs={12}>
          <Skeleton variant="text" width={200} height={30} />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={300}
            sx={{ mt: 2 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
