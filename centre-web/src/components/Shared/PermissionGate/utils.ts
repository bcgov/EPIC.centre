import { AppConfig } from "@/utils/config";
import { jwtDecode } from "jwt-decode";

export const hasPermission = ({
  permissions,
  scopes,
}: {
  permissions: string[];
  scopes: string[];
}) => {
  const scopesMap = scopes.reduce(
    (acc, scope) => {
      acc[scope] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  return permissions.some((permission) => scopesMap[permission]);
};

export const getUserRolesFromToken = (token?: string) => {
  if (!token) return [];
  const tokenData: any = jwtDecode(token);
  const appName = AppConfig.clientId;
  return tokenData?.resource_access?.[appName]?.roles || [];
};
