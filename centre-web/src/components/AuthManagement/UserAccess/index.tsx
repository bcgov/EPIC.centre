import { GreenBadge, GreyBadge } from "@/components/Shared/Badges";
import BarTitle from "@/components/Shared/BarTitle.tsx";
import { Alert, Box, Grid, Stack, Typography, Tooltip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { NewAccessRequests } from "./NewAccessRequests";
import { CurrentAccessLevel } from "./CurrentAccessLevel";
import { useGetUser, useUpdateUser } from "@/hooks/api/useUsers";
import { useParams } from "@tanstack/react-router";
import { UserAccessSkeleton } from "./UserAccessSkeleton";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useCurrentUser } from "@/contexts/UserContext";

export const UserAccess = () => {
  const auth = useAuth();
  const { isDstAdmin } = useCurrentUser();
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

  const canManageUserStatus = isDstAdmin && !isSelf;
  const disableButtonTooltip = isSelf
    ? "You cannot disable your own account"
    : "Only EPIC.centre admins can enable/disable users";

  return (
    <Box
      sx={{
        padding: "0 16px 16px 16px",
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
              <Typography variant="h4"  sx={{ mb: 0 }}>
                {user?.last_name ?? ""}, {user?.first_name ?? ""}
              </Typography>
              <Typography variant="body1" sx={{ mb: 0, mt: "-3px" }}>
                <a style={{ color: "#1e5189" }}href={`mailto:${user?.email ?? ""}`}>{user?.email ?? ""}</a>
              </Typography>
              <Typography variant="body1" sx={{ mb: 0, mt: "-3px" }}>
                {user?.attributes?.idir_username?.[0] && (
                  <span style={{ color: "#99A6B4" }}>
                    {user.attributes.idir_username[0]}
                  </span>
                )}
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
          alignItems={"flex-start"}
          justifyContent={"space-between"}
          gap={2}
          sx={{ mt: "10px", mb: "10px" }}
        >
          <Grid item xs sx={{ minWidth: 0, flex: 1}}>
            {user && !user.enabled && (
              <Box
                sx={{
                  backgroundColor: "#FEF1D8",
                  border: "1px solid #F8BB47",
                  borderRadius: "4px",
                  padding: "8px",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "16px",
                    fontStyle: "normal",
                    fontWeight: 400,
                    lineHeight: "27.008px",
                  }}
                >
                  This user is disabled. This means they won&apos;t be able to
                  access any EPIC applications. To re-enable this user, click the
                  &quot;Enable&quot; button to the right.
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item sx={{ flexShrink: 0 }}>
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
                  <LoadingButton
                    variant="outlined"
                    disabled
                    loading={isUpdating}
                  >
                    {user?.enabled ? "Disable User" : "Enable User"}
                  </LoadingButton>
                </span>
              </Tooltip>
            )}
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <NewAccessRequests user={user} />
        </Grid>
        <Grid item xs={12} mt={"24px"}>
          <CurrentAccessLevel user={user} />
        </Grid>
      </Grid>
    </Box>
  );
};
