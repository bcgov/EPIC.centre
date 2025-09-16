import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";
import PermissionsGate from "../Shared/PermissionGate";
import { SubListItem } from "./SubListItem";
import { EpicCentreRoles } from "@/models/Roles";

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
      {/* <PermissionsGate scopes={[EpicCentreRoles.manage_requests]}> */}
      <SubListItem
        key={`sub-list-auth-management`}
        route={{
          name: "EPIC.auth",
          path: `/request-access/auth`,
        }}
      />
      {/* </PermissionsGate> */}
    </>
  );
}
