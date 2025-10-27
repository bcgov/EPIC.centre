import { Box } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { BCDesignTokens } from "epic.theme";

type AppUserManagementButtonProps = {
  appUserManagementUrl?: string;
  supportsGranularRoleManagement: boolean;
  tabIndex?: number;
};

export const AppUserManagementButton = ({
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Box
      component="span"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      role="button"
      sx={{
        color: BCDesignTokens.themeBlue90,
        textDecoration: "underline",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "inherit",
        lineHeight: "inherit",
        "&:focus": {
          outline: `2px solid ${BCDesignTokens.themeBlue90}`,
          outlineOffset: "2px",
          borderRadius: "2px",
        },
        "&:focus-visible": {
          outline: `2px solid ${BCDesignTokens.themeBlue90}`,
          outlineOffset: "2px",
          borderRadius: "2px",
        },
      }}
    >
      App User Management
      <OpenInNewIcon sx={{ fontSize: "1rem", verticalAlign: "middle" }} />
    </Box>
  );
};
