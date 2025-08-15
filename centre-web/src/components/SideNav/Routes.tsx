import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";

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
          path: "/launchpad",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
    </>
  );
}
