import { EpicAppName } from "@/models/EpicApp";

const EpicAppNameToChipTitleMap = {
  [EpicAppName.CONDITION_REPOSITORY]: "Cond. Repo.",
  [EpicAppName.EPIC_COMPLIANCE]: "EPIC.compliance",
  [EpicAppName.EPIC_TRACK]: "EPIC.track",
  [EpicAppName.EPIC_SUBMIT]: "EPIC.submit",
  [EpicAppName.EPIC_ENGAGE]: "EPIC.engage",
  [EpicAppName.EPIC_PUBLIC]: "EPIC.public",
   [EpicAppName.EPIC_CENTRE]: "EPIC.auth",
};

export const getAppChipTitle = (appName: string): string => {
  return (
    EpicAppNameToChipTitleMap[
      appName as keyof typeof EpicAppNameToChipTitleMap
    ] || appName
  );
};
