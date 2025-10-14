import { BCDesignTokens } from "epic.theme";
import { useAuth } from "react-oidc-context";
import { MainListItem } from "./MainListItem";
import { SubListItem } from "./SubListItem";
import { isAdministrator } from "@/utils/roleUtils";

export default function Routes() {
  const { user } = useAuth();
  const hasAdminRole = isAdministrator(user?.access_token);

  return (
    <>
      <MainListItem
        route={{
          name: "Launchpad",
          path: "/launchpad",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      <MainListItem
        route={{
          name: "Request Access",
          path: "/request-access",
        }}
      />
      {hasAdminRole && (
        <SubListItem
          key={`sub-list-auth-management`}
          route={{
            name: "EPIC.auth",
            path: `/request-access/auth`,
          }}
        />
      )}
    </>
  );
}
