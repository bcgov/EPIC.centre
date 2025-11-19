import { GreenBadge, GreyBadge } from "@/components/Shared/Badges";
import BarTitle from "@/components/Shared/BarTitle.tsx";
import { Box, Grid, Stack, Typography, Tooltip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { NewAccessRequests } from "./NewAccessRequests";
import { CurrentAccessLevel } from "./CurrentAccessLevel";
import { useGetUser, useUpdateUser } from "@/hooks/api/useUsers";
import { useParams } from "@tanstack/react-router";
import { UserAccessSkeleton } from "./UserAccessSkeleton";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { isDSTUser } from "@/utils/roleUtils";

export const UserAccess = () => {
  const auth = useAuth();
  const { username } = useParams({
    from: "/_authenticated/request-access/auth/users/$username",
  });
  const {
    data: user,
    isPending,
    refetch: refetchUser,
  } = useGetUser({
    username: String(username),
    enabled: !!username,
  });

  const { mutateAsync: updateUser } = useUpdateUser();

  const [isUpdating, setIsUpdating] = useState(false);

  const isDST = isDSTUser(auth.user?.access_token);
  const currentUsername = auth.user?.profile.preferred_username;
  const isSelf = currentUsername === user?.username;

  const handleEnableUser = async (enable: boolean) => {
    if (!user) return;

    setIsUpdating(true);
    await updateUser({
      username: user.username,
      enabled: enable,
    });

    await refetchUser();
    setIsUpdating(false);
  };

  if (isPending) {
    return <UserAccessSkeleton />;
  }

  const canManageUserStatus = isDST && !isSelf;
  const disableButtonTooltip = isSelf
    ? "You cannot disable your own account"
    : "Only EPIC.centre admins can enable/disable users";

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
        <Grid
          item
          xs={12}
          container
          alignItems={"flex-end"}
          justifyContent={"flex-end"}
        >
          {canManageUserStatus ? (
            <LoadingButton
              variant="outlined"
              onClick={() => handleEnableUser(!user?.enabled)}
              loading={isUpdating}
            >
              {user?.enabled ? "Disable User" : "Enable User"}
            </LoadingButton>
          ) : (
            <Tooltip title={disableButtonTooltip}>
              <span>
                <LoadingButton variant="outlined" disabled loading={isUpdating}>
                  {user?.enabled ? "Disable User" : "Enable User"}
                </LoadingButton>
              </span>
            </Tooltip>
          )}
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
