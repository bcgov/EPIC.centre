import { Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

type AppUserManagementButtonProps = {
  appName: string;
  appUserManagementUrl?: string;
  supportsGranularRoleManagement: boolean;
  tabIndex?: number;
};

export const AppUserManagementButton = ({
  appName,
  appUserManagementUrl,
  supportsGranularRoleManagement,
  tabIndex,
}: AppUserManagementButtonProps) => {
  // Don't render if the app doesn't support granular role management or if no URL is provided
  if (!supportsGranularRoleManagement || !appUserManagementUrl) {
    return null;
  }

  const handleClick = () => {
    if (appUserManagementUrl) {
      window.open(appUserManagementUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button
      variant="text"
      size="small"
      endIcon={<OpenInNewIcon />}
      onClick={handleClick}
      tabIndex={tabIndex}
      sx={{
        color: "#1976d2",
        textTransform: "none",
        fontWeight: "normal",
        "&:hover": {
          backgroundColor: "rgba(25, 118, 210, 0.04)",
        },
        "&:focus": {
          outline: "2px solid #1976d2",
          outlineOffset: "2px",
          backgroundColor: "rgba(25, 118, 210, 0.08)",
        },
        "&:focus-visible": {
          outline: "2px solid #1976d2",
          outlineOffset: "2px",
          backgroundColor: "rgba(25, 118, 210, 0.08)",
        },
      }}
    >
      App User Management
    </Button>
  );
};

