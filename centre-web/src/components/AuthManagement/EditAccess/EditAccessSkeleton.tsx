import { Skeleton, Stack } from "@mui/material";

export const EditAccessModalSkeleton = () => {
  return (
    <Stack spacing={2}>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" width="100%" height={32} />
      ))}
      <Stack direction="row" spacing={2} justifyContent="flex-end" mt="24px">
        <Skeleton variant="rectangular" width={90} height={36} />
        <Skeleton variant="rectangular" width={120} height={36} />
      </Stack>
    </Stack>
  );
};
