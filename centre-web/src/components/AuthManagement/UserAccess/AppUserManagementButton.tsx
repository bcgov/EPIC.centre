import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { CentreLink } from "@/components/Shared/CentreLink";

type AppUserManagementButtonProps = {
  appUserManagementUrl?: string;
  supportsGranularRoleManagement: boolean;
  tabIndex?: number;
};

export const AppUserManagementButton = ({
  appUserManagementUrl,
  supportsGranularRoleManagement,
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
    <CentreLink onClick={handleClick}>
      App User Management
      <OpenInNewIcon
        sx={{ fontSize: "1rem", verticalAlign: "middle", marginLeft: "4px" }}
      />
    </CentreLink>
  );
};
