import { RequestAccessCatalog, RequestAccessStatus } from "@/models/EpicApp";
import { Box, Button, Divider, Tooltip } from "@mui/material";
import { AccessLogSection } from "../LaunchAppTile/AccessLogSection";
import { BCDesignTokens } from "epic.theme";
import { LoadingButton } from "../Shared/LoadingButton";
import {
  useCreateAccessRequest,
  useGetRequestCatalogApplications,
} from "@/hooks/api/useApplications";
import { useState } from "react";
import { isAxiosError } from "axios";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { useAuth } from "react-oidc-context";
import { isDSTUser } from "@/utils/roleUtils";

type RequestAccessButton = {
  appId: number;
  status: RequestAccessStatus;
};
const RequestAccessButton = ({ appId, status }: RequestAccessButton) => {
  const auth = useAuth();
  const { mutateAsync: createAccessRequest } = useCreateAccessRequest();
  const { refetch: refetchRequestCatalog } = useGetRequestCatalogApplications();
  const [loading, setLoading] = useState(false);

  const isDST = isDSTUser(auth.user?.access_token);

  const handleRequestAccess = async () => {
    setLoading(true);
    try {
      await createAccessRequest(appId);
      await refetchRequestCatalog();
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.message || "Unknown error"
        : "Unknown error";
      notify.error(`Error creating access request: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === RequestAccessStatus.PENDING) {
    return (
      <Button
        variant="contained"
        fullWidth
        style={{
          border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
          backgroundColor: BCDesignTokens.supportSurfaceColorWarning,
          color: BCDesignTokens.iconsColorPrimary,
        }}
        disabled
      >
        Request Sent
      </Button>
    );
  }

  if (isDST) {
    return (
      <Tooltip title="As an EPIC.centre admin, you can grant yourself access through EPIC.auth">
        <span>
          <Button variant="contained" fullWidth disabled>
            Request Access
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <LoadingButton
      variant="contained"
      fullWidth
      disabled={status === RequestAccessStatus.ACCESSED}
      loading={loading}
      onClick={handleRequestAccess}
    >
      Request Access
    </LoadingButton>
  );
};

type BodyProps = {
  data: RequestAccessCatalog;
};
export const Body = ({ data }: BodyProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px 12px 12px 12px",
        gap: "8px",
      }}
    >
      <RequestAccessButton appId={data.id} status={data.status} />
      <Box
        sx={{
          padding: "8px 0 12px 0",
        }}
      >
        <Divider
          sx={{
            width: "320px",
            backgroundColor: BCDesignTokens.themeGray50,
          }}
          aria-label="Bookmarks divider"
        />
      </Box>

      <Box width="100%">
        <AccessLogSection user={data.user} />
      </Box>
    </Box>
  );
};
