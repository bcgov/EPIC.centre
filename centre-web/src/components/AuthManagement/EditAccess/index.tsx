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
} from "@mui/material";
import { useGeteApplicationAccessLevels } from "@/hooks/api/useApplications";
import { CentreUser, CentreUserApp } from "@/models/CentreUser";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";
import { modalStyle } from "@/components/Shared/Modals/constants";
import { getAppChipTitle } from "../utils";
import { Else, If, Then, Unless, When } from "react-if";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { EditAccessModalSkeleton } from "./EditAccessSkeleton";
import { CentreRadio } from "@/components/Shared/CentreRadio";

type EditAccessModalProps = {
  user: CentreUser;
  app: CentreUserApp;
};
export const EditAccessModal = ({ app }: EditAccessModalProps) => {
  const { setClose } = useModal();
  const [selectedRole, setSelectedRole] = useState<string | null>(
    app.group_name ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: accessLevels = [],
    isLoading: accessLevelsLoading,
    error: accessLevelsError,
  } = useGeteApplicationAccessLevels({
    appName: app.name,
  });

  const currentRole = app.role;

  const handleConfirm = async () => {
    if (!selectedRole) {
      notify.error("Please select an access level.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      //   await updateUserRole({
      //     username,
      //     application: applicationName,
      //     role: selectedRole,
      //   });

      notify.success("Access level updated.");
      setClose();
    } catch (err) {
      const fallback =
        "Unable to update access level. Please try again or contact support.";
      if (isAxiosError(err)) {
        const msg = err.response?.data?.message ?? fallback;
        setErrorMsg(msg);
      } else {
        setErrorMsg(fallback);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const REVOKE_OPTION = {
    label: "Revoke Access",
    value: "revoke",
  };
  const DENY_OPTION = {
    label: "Deny Access Request",
    value: "deny",
  };

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
                    value={accessLevel.group_name}
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

          <Grid item xs={12} container justifyContent="flex-end">
            <Stack
              direction="row"
              spacing={"8px"}
              mt="24px"
              justifyContent="flex-end"
            >
              <Button variant="outlined" onClick={setClose}>
                Close
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleConfirm}
                loading={submitting}
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
