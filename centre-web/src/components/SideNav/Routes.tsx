import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";
import { SubListItem } from "./SubListItem";

export default function Routes() {
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
      <SubListItem
        key={`sub-list-auth-management`}
        route={{
          name: "EPIC.auth",
          path: `/request-access/auth`,
        }}
      />
    </>
  );
}
