import {
  Box,
  Divider,
  Grid,
  Typography,
  Button,
  Stack,
  RadioGroup,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useGeteApplicationAccessLevels } from "@/hooks/api/useApplications";
import { CentreUser, CentreUserApp } from "@/models/CentreUser";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { useMemo, useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";
import { modalStyle } from "@/components/Shared/Modals/constants";
import { getAppChipTitle } from "../utils";
import { Unless, When } from "react-if";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { EditAccessModalSkeleton } from "./EditAccessSkeleton";
import { CentreRadio } from "@/components/Shared/CentreRadio";
import {
  useGetUser,
  useRevokeUserAccess,
  useUpdateUserGroup,
} from "@/hooks/api/useUsers";
import { EPIC_APP_TO_GROUP } from "@/models/KCGroup";
import { AccessRequest, AccessRequestStatus } from "@/models/AccessRequest";
import {
  useUpdateAccessRequest,
  useUserAccessRequests,
} from "@/hooks/api/useAccessRequests";

const AccessLevelWarningMessage = (groupPath: string) => {
  if (groupPath === "/ENGAGE/EAO_TEAM_MEMBER") {
    return (
      <Alert
        severity="info"
        sx={{ backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0" }}
      >
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Please Note:</strong> When you click the "Confirm" button,
          this user will be added as a Team Member in EPIC.engage.
        </Typography>
        <Typography variant="body2">
          To assign this user to some engagements, please go to the User
          Management section in EPIC.engage by clicking the "App User
          Management" link.
        </Typography>
      </Alert>
    );
  }

  if (groupPath === "/TRACK/VIEWER") {
    return (
      <Alert
        severity="info"
        sx={{ backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0" }}
      >
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Please Note:</strong> When you click the "Confirm" button,
          this user will be added as a Viewer in EPIC.track.
        </Typography>
        <Typography variant="body2">
          To assign this user as Team Member in specific Works, please go to the
          User Management section in EPIC.track by clicking the "App User
          Management" link.
        </Typography>
      </Alert>
    );
  }

  return null;
};

type EditAccessModalProps = {
  user: CentreUser;
  app: CentreUserApp;
  onClose?: () => void;
  username: string;
  request?: AccessRequest;
};

export const EditAccessModal = ({
  app,
  onClose,
  user,
  username,
  request,
}: EditAccessModalProps) => {
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
  const { refetch } = useGetUser({
    username: String(username),
    enabled: !!username,
  });

  const { setClose } = useModal();
  const [selectedRole, setSelectedRole] = useState<string | null>(
    app.group_path ?? null,
  );

  const supportsGranularRoleManagement =
    app.supportsGranularRoleManagement ?? false;

  const {
    data: accessLevels = [],
    isLoading: accessLevelsLoading,
    error: accessLevelsError,
  } = useGeteApplicationAccessLevels({
    appName: app.name,
  });

  const handleUpdateError = (error: unknown) => {
    if (isAxiosError(error)) {
      notify.error(
        error.response?.data?.message || "Failed to update user access.",
      );
    } else {
      notify.error("Failed to update user access.");
    }
    setClose();
  };

  const { mutateAsync: updateUserGroup, error: updateError } =
    useUpdateUserGroup({
      onError: handleUpdateError,
    });

  const { mutateAsync: revokeUserAccess } = useRevokeUserAccess({
    onError: handleUpdateError,
  });

  const { mutateAsync: updateAccessRequest } = useUpdateAccessRequest({
    onError: handleUpdateError,
  });

  const { refetch: refetchAccessRequests } = useUserAccessRequests({
    user_auth_guid: user?.id || "",
    status: AccessRequestStatus.PENDING,
    enabled: !!user?.id,
  });

  const currentRole = app.role;

  const REVOKE_OPTION = {
    label: "Revoke Access",
    value: "revoke",
  };
  const DENY_OPTION = {
    label: "Deny Access Request",
    value: "deny",
  };

  const handleConfirm = async () => {
    const isDeny = selectedRole === DENY_OPTION.value;
    const isRevoke = selectedRole === REVOKE_OPTION.value;

    const selectedAccessLevel = accessLevels.find(
      (level) => level.group_path === selectedRole,
    );
    if (!selectedAccessLevel && !isRevoke && !isDeny) {
      notify.error("Please select an access level.");
      return;
    }

    const parentGroupName =
      EPIC_APP_TO_GROUP[app.name as keyof typeof EPIC_APP_TO_GROUP];
    if (!parentGroupName) {
      notify.error("Invalid application name.");
      return;
    }
    setIsUpdatingAccess(true);

    try {
      if (selectedRole === REVOKE_OPTION.value) {
        /// Revoke Access
        await revokeUserAccess({
          username: user.username,
          appName: app.name,
        });
      } else if (!request) {
        return;
      } else if (selectedRole === DENY_OPTION.value) {
        // Deny Access Request
        await updateAccessRequest({
          access_request_id: request.id,
          status: AccessRequestStatus.REJECTED,
        });
        await refetchAccessRequests();
      } else if (selectedAccessLevel) {
        await updateUserGroup({
          username: user.username,
          groupName: selectedAccessLevel.group_name,
          appName: app.name,
          parentGroupName: parentGroupName,
          accessRequestId: request.id,
        });
        await refetchAccessRequests();
      } else {
        notify.error("Please select a valid access level.");
      }
      await refetch();
      notify.success("User access updated successfully.");
    } catch (error) {
      if (isAxiosError(error)) {
        notify.error(
          error.response?.data?.message || "Failed to update user access.",
        );
      } else {
        notify.error("Failed to update user access.");
      }
    } finally {
      setIsUpdatingAccess(false);
      setClose();
    }
  };

  const errorMsg = useMemo(() => {
    if (updateError) {
      if (isAxiosError(updateError)) {
        return (
          updateError.response?.data?.message || "Failed to update user access."
        );
      }
      return "Failed to update user access.";
    }
    return null;
  }, [updateError]);

  if (accessLevelsLoading) {
    return (
      <Box
        sx={{
          ...modalStyle,
          padding: "16px",
          height: "500px",
          width: "500px",
          overflowY: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <CircularProgress />
        </div>
      </Box>
    );
  }

  return (
    <Box
      sx={{ ...modalStyle, padding: "16px", width: "810px", overflowY: "none" }}
    >
      <Grid container rowGap="10px">
        <Grid item xs={12}>
          <Typography variant="h3">
            User Access - {getAppChipTitle(app.name)}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ width: "702px" }} />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body1" color="#000" fontWeight={"bold"}>
              Current Access Level:
            </Typography>
            <Typography variant="body1">
              {currentRole ?? "No Access"}
            </Typography>
          </Stack>
        </Grid>

        <When condition={accessLevelsLoading}>
          <Grid item xs={12}>
            <EditAccessModalSkeleton />
          </Grid>
        </When>

        <Unless condition={accessLevelsLoading ?? accessLevelsError}>
          <Grid item xs={12} mt={2}>
            <FormControl sx={{ margin: 0 }}>
              <FormLabel sx={{ fontWeight: "bold", color: "#000" }}>
                What access level would you like this user to have in{" "}
                {getAppChipTitle(app.name)}?
              </FormLabel>
              <RadioGroup
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {accessLevels.map((accessLevel) => (
                  <CentreRadio
                    key={accessLevel.name}
                    value={accessLevel.group_path}
                    label={accessLevel.name}
                  />
                ))}
                {currentRole && (
                  <CentreRadio
                    key={REVOKE_OPTION.label}
                    value={REVOKE_OPTION.value}
                    label={REVOKE_OPTION.label}
                  />
                )}
                {request && (
                  <CentreRadio
                    key={DENY_OPTION.label}
                    value={DENY_OPTION.value}
                    label={DENY_OPTION.label}
                  />
                )}
              </RadioGroup>
            </FormControl>
          </Grid>

          {errorMsg && (
            <Grid item xs={12}>
              <Typography color="error" sx={{ mt: 1 }}>
                {errorMsg}
              </Typography>
            </Grid>
          )}

          {AccessLevelWarningMessage(selectedRole || "")}

          <Grid item xs={12} container justifyContent="flex-end">
            <Stack
              direction="row"
              spacing={"8px"}
              mt="24px"
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setClose();
                  onClose?.();
                }}
              >
                Close
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleConfirm}
                loading={isUpdatingAccess}
              >
                Confirm
              </LoadingButton>
            </Stack>
          </Grid>
        </Unless>
      </Grid>
    </Box>
  );
};
