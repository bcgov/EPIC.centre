import { Box, Paper, Skeleton, Stack } from "@mui/material";
import { BookmarkSectionSkeleton } from "../LaunchAppTile/BookmarkSectionSkeleton";

// DocumentSearch Skeleton
export const DocumentSearchSkeleton = () => {
  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      {/* Header Skeleton */}
      <Box sx={{ height: 81, backgroundColor: "#F1F8FE", mb: 2, p: 1 }}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
      {/* Body Skeleton */}
      <Stack spacing={1}>
        <Skeleton variant="rectangular" height={40} width="100%" />
        <Skeleton variant="rectangular" height={36} width={160} />
        <Skeleton variant="rectangular" height={1} width="100%" />
        <BookmarkSectionSkeleton />
      </Stack>
    </Paper>
  );
};
