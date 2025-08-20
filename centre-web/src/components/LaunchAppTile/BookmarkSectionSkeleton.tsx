import { Box, Skeleton, Stack } from "@mui/material";

export const BookmarkSectionSkeleton = () => {
  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Stack direction="row" justifyContent="space-between" spacing={1} mb={1}>
        <Skeleton variant="text" width="30%" height={28} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </Stack>
      <Stack direction="column" spacing={1}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} variant="text" width="100%" height={24} />
        ))}
      </Stack>
    </Box>
  );
};
