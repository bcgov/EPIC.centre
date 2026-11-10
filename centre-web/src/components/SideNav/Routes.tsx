import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";
import { SubListItem } from "./SubListItem";
import { useCurrentUser } from "@/contexts/UserContext";
import { AppConfig } from "@/utils/config";

export default function Routes() {
  const { isAdmin, canViewApplicationUrls, canViewMap } = useCurrentUser();

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
      {isAdmin && (
        <SubListItem
          key={`sub-list-auth-management`}
          route={{
            name: "EPIC.auth",
            path: `/request-access/auth`,
          }}
        />
      )}
      {AppConfig.mapEnabled && canViewMap && (
        <MainListItem
          route={{
            name: "Map",
            path: "/map",
          }}
        />
      )}
      {canViewApplicationUrls && (
        <MainListItem
          route={{
            name: "Application URLs/SSL",
            path: "/application-urls",
          }}
        />
      )}
    </>
  );
}
