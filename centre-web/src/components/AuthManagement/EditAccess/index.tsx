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
import { Else, If, Then, Unless, When } from "react-if";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { EditAccessModalSkeleton } from "./EditAccessSkeleton";
import { CentreRadio } from "@/components/Shared/CentreRadio";
import { useGetUser, useUpdateUserGroup } from "@/hooks/api/useUsers";
import { EPIC_APP_TO_GROUP } from "@/models/KCGroup";

type EditAccessModalProps = {
  user: CentreUser;
  app: CentreUserApp;
  onClose?: () => void;
  username: string;
};

export const EditAccessModal = ({
  app,
  onClose,
  user,
  username,
}: EditAccessModalProps) => {
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
  const { refetch } = useGetUser({
    username: String(username),
    enabled: !!username,
  });

  const { setClose } = useModal();
  const [selectedRole, setSelectedRole] = useState<string | null>(
    app.group_name ?? null,
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
    const selectedAccessLevel = accessLevels.find(
      (level) => level.group_path === selectedRole,
    );
    if (!selectedAccessLevel) {
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
      } else if (selectedRole === DENY_OPTION.value) {
        // Deny Access Request
      } else {
        await updateUserGroup({
          username: user.username,
          groupName: selectedAccessLevel.group_name,
          appName: parentGroupName,
        });
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
                <If condition={currentRole}>
                  <Then>
                    <CentreRadio
                      key={REVOKE_OPTION.label}
                      value={REVOKE_OPTION.value}
                      label={REVOKE_OPTION.label}
                    />
                  </Then>
                  <Else>
                    <CentreRadio
                      key={DENY_OPTION.label}
                      value={DENY_OPTION.value}
                      label={DENY_OPTION.label}
                    />
                  </Else>
                </If>
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

          {/* Please Note section for apps with granular role management */}
          <If
            condition={
              supportsGranularRoleManagement &&
              selectedRole &&
              selectedRole !== REVOKE_OPTION.value &&
              selectedRole !== DENY_OPTION.value
            }
          >
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Alert
                severity="info"
                sx={{ backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0" }}
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Please Note:</strong> When you click the "Confirm"
                  button, this user will be added as a{" "}
                  {accessLevels.find(
                    (level) => level.group_name === selectedRole,
                  )?.name || selectedRole}{" "}
                  in {getAppChipTitle(app.name)}.
                </Typography>
                <Typography variant="body2">
                  To assign this user to some engagements, please go to the User
                  Management section in {getAppChipTitle(app.name)} by clicking
                  the "App User Management" link.
                </Typography>
              </Alert>
            </Grid>
          </If>

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
