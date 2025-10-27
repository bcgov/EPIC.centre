import { CentreUser } from "@/models/CentreUser";
import { EPIC_ADMIN_GROUPS } from "@/models/KCGroup";

export const getAllAppsWithRoles = (userApps: CentreUser["apps"] = []) => {
  const allAppNames = Object.keys(EPIC_ADMIN_GROUPS);
  const userAppsMap = new Map(userApps.map((app) => [app.name, app]));
  return allAppNames.map(
    (name) =>
      userAppsMap.get(name) ?? {
        name,
        role: null,
        group_name: null,
        group_path: null,
      },
  );
};
