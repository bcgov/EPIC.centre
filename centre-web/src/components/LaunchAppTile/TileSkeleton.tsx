import { Box, Paper, Skeleton, Stack } from "@mui/material";

// LaunchAppTile Skeleton (refined)
export const LaunchAppTileSkeleton = () => {
  return (
    <Paper elevation={3} sx={{ width: 345 }}>
      {/* Header Skeleton */}
      <Box sx={{ height: 110, backgroundColor: "#F1F8FE", p: 2, mb: 1 }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
      </Box>

      {/* Content Skeleton */}
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Open in new tab button */}
        <Skeleton variant="rectangular" height={40} width="100%" />

        {/* Bookmark Section Skeleton */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={1}
            mb={1}
          >
            <Skeleton variant="text" width="30%" height={28} />
            <Skeleton variant="rectangular" width={100} height={36} />
          </Stack>
          <Stack direction="column" spacing={1}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} variant="text" width="100%" height={24} />
            ))}
          </Stack>
        </Box>

        {/* Divider */}
        <Skeleton variant="rectangular" height={1} width="100%" />

        {/* Labeled Items */}
        <Stack spacing={1} width={185}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="60%" height={20} />
        </Stack>
      </Box>
    </Paper>
  );
};
