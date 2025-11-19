import {
  Box,
  Divider,
  Grid,
  Typography,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useGeteApplicationAccessLevels } from "@/hooks/api/useApplications";
import { CentreUser, CentreUserApp } from "@/models/CentreUser";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { useState, useMemo } from "react";
import { modalStyle } from "@/components/Shared/Modals/constants";
import { getAppChipTitle } from "../utils";
import { Unless, When } from "react-if";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { EditAccessModalSkeleton } from "./EditAccessSkeleton";
import { useGetUser } from "@/hooks/api/useUsers";
import { AccessRequest } from "@/models/AccessRequest";
import { AccessLevelWarning } from "./AccessLevelWarning";
import { AccessLevelSelection } from "./AccessLevelSelection";
import { useAccessActions } from "./useAccessActions";
import { useAuth } from "react-oidc-context";
import { isDSTUser, getAdminStatusPerApp } from "@/utils/roleUtils";
import { EpicAppName } from "@/models/EpicApp";

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
  const auth = useAuth();
  const { refetch } = useGetUser({
    username: String(username),
    enabled: !!username,
  });

  const { setClose } = useModal();
  const [selectedRole, setSelectedRole] = useState<string | null>(
    app.group_path ?? null,
  );

  const { data: accessLevels = [], isLoading: accessLevelsLoading } =
    useGeteApplicationAccessLevels({
      appName: app.name,
    });

  const handleClose = () => {
    setClose();
    onClose?.();
  };

  const { isUpdating, executeAction } = useAccessActions({
    username: user.username,
    appName: app.name,
    userId: user.id,
    onClose: handleClose,
  });

  const currentRole = app.role;

  const isDST = isDSTUser(auth.user?.access_token);
  const adminStatus = getAdminStatusPerApp(auth.user?.access_token);
  const isComplianceAdmin = adminStatus[EpicAppName.EPIC_COMPLIANCE];
  const isEpicCompliance = app.name === EpicAppName.EPIC_COMPLIANCE;

  const disabledOptions = useMemo(() => {
    if (isEpicCompliance && isDST && !isComplianceAdmin) {
      return accessLevels.map((level) => level.group_path);
    }
    return [];
  }, [isEpicCompliance, isDST, isComplianceAdmin, accessLevels]);

  const handleConfirm = async () => {
    const success = await executeAction(
      selectedRole,
      accessLevels,
      request?.id,
    );
    if (success) {
      await refetch();
    }
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <CircularProgress />
        </Box>
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

        <Unless condition={accessLevelsLoading}>
          <AccessLevelSelection
            appName={app.name}
            accessLevels={accessLevels}
            selectedRole={selectedRole}
            currentRole={currentRole}
            request={request}
            onRoleChange={setSelectedRole}
            disabledOptions={disabledOptions}
          />

          {selectedRole && <AccessLevelWarning groupPath={selectedRole} />}

          <Grid item xs={12} container justifyContent="flex-end">
            <Stack
              direction="row"
              spacing={"8px"}
              mt="24px"
              justifyContent="flex-end"
            >
              <Button variant="outlined" onClick={handleClose}>
                Close
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleConfirm}
                loading={isUpdating}
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
