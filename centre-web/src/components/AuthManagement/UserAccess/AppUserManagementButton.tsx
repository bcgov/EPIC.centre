import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box } from "@mui/material";
import { CentreLink } from "@/components/Shared/CentreLink";

type AppUserManagementButtonProps = {
  appUserManagementUrl?: string;
  supportsGranularRoleManagement: boolean;
  disabled?: boolean;
};

export const AppUserManagementButton = ({
  appUserManagementUrl,
  supportsGranularRoleManagement,
  disabled = false,
}: AppUserManagementButtonProps) => {
  // Don't render if the app doesn't support granular role management or if no URL is provided
  if (!supportsGranularRoleManagement || !appUserManagementUrl) {
    return null;
  }

  const handleClick = () => {
    if (appUserManagementUrl && !disabled) {
      window.open(appUserManagementUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (disabled) {
    return (
      <Box
        component="span"
        sx={{
          color: "#898785",
          cursor: "default",
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        App User Management
        <OpenInNewIcon
          sx={{ fontSize: "1rem", verticalAlign: "middle", marginLeft: "4px" }}
        />
      </Box>
    );
  }

  return (
    <CentreLink onClick={handleClick} sx={{ whiteSpace: "nowrap" }}>
      App User Management
      <OpenInNewIcon
        sx={{ fontSize: "1rem", verticalAlign: "middle", marginLeft: "4px" }}
      />
    </CentreLink>
  );
};
