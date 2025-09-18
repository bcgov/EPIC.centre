import { cloneElement, useMemo } from "react";
import { getUserRolesFromToken, hasPermission } from "./utils";
import { useAuth } from "react-oidc-context";

type PermissionsGateProps = Readonly<{
  children: React.ReactElement;
  RenderError?: React.ComponentType;
  errorProps?: Record<string, unknown>;
  scopes: string[];
}>;

export default function PermissionsGate({
  children,
  RenderError = () => <></>,
  scopes = [],
  errorProps,
}: PermissionsGateProps) {
  const { user } = useAuth();

  const permissions = useMemo(
    () => getUserRolesFromToken(user?.access_token) || [],
    [user?.access_token],
  );

  const permissionGranted = hasPermission({ permissions, scopes });

  if (!permissionGranted && !errorProps) return <RenderError />;

  if (!permissionGranted && errorProps)
    return cloneElement(children, { ...errorProps });

  return <>{children}</>;
}
