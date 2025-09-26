import {
  Box,
  Divider,
  Grid,
  Typography,
  Button,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  FormControl,
  FormLabel,
} from "@mui/material";
import { useModal } from "../Shared/Modals/modalStore";
import { useState, useEffect } from "react";
import { modalStyle } from "../Shared/Modals/constants";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";

// 🔁 Replace with actual hooks
// import { useGetUser } from "@/hooks/api/useGetUser";
// import { useUpdateUserRole } from "@/hooks/api/useUpdateUserRole";
import { LoadingButton } from "../Shared/LoadingButton";
import { LabeledItem } from "../Shared/LabeledItem";
import { Else, If, Then } from "react-if";
import { CentreUser, CentreUserApp } from "@/models/CentreUser";
import { getAppChipTitle } from "./utils";

type EditAccessModalProps = {
  user: CentreUser;
  app: CentreUserApp;
};

export const EditAccessModal = ({ user, app }: EditAccessModalProps) => {
  const { setClose } = useModal();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentRole = "role";

  // 🧠 Init selected role (if user has a current role)
  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    } else {
      setSelectedRole(null);
    }
  }, [currentRole]);

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

  const revokeLabel = currentRole ? "Revoke Access" : "Deny Access Request";

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
          <LabeledItem label="Current Access Level">
            <Typography variant="body2">
              {currentRole ?? "No Access"}
            </Typography>
          </LabeledItem>
        </Grid>

        {/* <Typography variant="body2" sx={{ mt: "12px", mb: "4px" }}>
            What access level would you like this user to have in{" "}
            {applicationName}?
          </Typography> */}

        <Grid item xs={12}>
          <FormControl>
            <FormLabel>
              What access level would you like this user to have in {app.name}?
            </FormLabel>
            <RadioGroup
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {/* {availableRoles.map((role) => {
                return (
                  <FormControlLabel
                    key={role.value}
                    value={role.value}
                    control={<Radio />}
                    label={role.label}
                  />
                );
              })} */}
              <FormControlLabel
                key={revokeLabel}
                value={"revoke"}
                control={<Radio />}
                label={revokeLabel}
              />
              <If condition={currentRole}>
                <Then>
                  <FormControlLabel
                    key={REVOKE_OPTION.label}
                    value={REVOKE_OPTION.value}
                    control={<Radio />}
                    label={REVOKE_OPTION.label}
                  />
                </Then>
                <Else>
                  <FormControlLabel
                    key={DENY_OPTION.label}
                    value={DENY_OPTION.value}
                    control={<Radio />}
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
      </Grid>
    </Box>
  );
};
