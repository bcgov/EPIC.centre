import { GreenBadge, GreyBadge } from "@/components/Shared/Badges";
import BarTitle from "@/components/Shared/BarTitle.tsx";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { NewAccessRequests } from "./NewAccessRequests";
import { CurrentAccessLevel } from "./CurrentAccessLevel";
import { useGetUser } from "@/hooks/api/useUsers";
import { useParams } from "@tanstack/react-router";
import { UserAccessSkeleton } from "./UserAccessSkeleton";

export const UserAccess = () => {
  const { username } = useParams({
    from: "/_authenticated/request-access/auth/users/$username",
  });
  const { data: user, isPending } = useGetUser({
    username: String(username),
    enabled: !!username,
  });

  if (isPending) {
    return <UserAccessSkeleton />;
  }

  return (
    <Box
      sx={{
        padding: "16px",
        border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
      }}
    >
      <Grid container alignItems="flex-start">
        <Grid
          item
          xs={12}
          container
          justifyContent={"space-between"}
          alignItems="center"
        >
          <Grid item>
            <BarTitle>
              <Typography variant="h4" gutterBottom>
                {user?.last_name ?? ""}, {user?.first_name ?? ""}
              </Typography>
            </BarTitle>
          </Grid>
          <Grid item>
            <Stack direction="row" alignContent={"center"} alignItems="center">
              <Typography
                variant="subtitle1"
                sx={{ mr: "20px", fontWeight: "bold", color: "#99A6B4" }}
              >
                Status:
              </Typography>
              <Typography variant="body1">
                {user?.enabled ? (
                  <GreenBadge label="Active" />
                ) : (
                  <GreyBadge label="Inactive" />
                )}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Grid item xs={12} mt={"24px"}>
          <NewAccessRequests user={user} />
        </Grid>
        <Grid item xs={12} mt={"24px"}>
          <CurrentAccessLevel user={user} />
        </Grid>
      </Grid>
    </Box>
  );
};
