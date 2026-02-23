import { PageLoader } from "@/components/PageLoader";
import SideNavBar from "@/components/SideNav/SideNavBar";
import { useCurrentUser } from "@/contexts/UserContext";
import {
  useRecordLogin,
  EPIC_CENTRE_APP_NAME,
} from "@/hooks/api/useEaoAnalytics";
import { OidcConfig } from "@/utils/config";
import { Box } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedRoute,
});

function AuthenticatedRoute() {
  const { isAuthenticated, signinRedirect, isLoading } = useAuth();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { mutate: recordLogin } = useRecordLogin();
  const hasRecordedLogin = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      signinRedirect({
        redirect_uri: window.location.href,
        extraQueryParams: {
          kc_idp_hint: OidcConfig.extraQueryParams?.kc_idp_hint || "",
        },
      });
    }
  }, [isAuthenticated, isLoading, signinRedirect]);

  // Record login to centre API (eao-analytics) once per session
  useEffect(() => {
    if (user?.id && !hasRecordedLogin.current) {
      hasRecordedLogin.current = true;
      recordLogin(
        { user_auth_guid: user.id, app_name: EPIC_CENTRE_APP_NAME },
        { onError: () => {} },
      );
    }
  }, [user?.id, recordLogin]);

  if (isLoading || userLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/unauthenticated" />;
  }

  return (
    <div>
      <Box flexDirection={"row"} display={"flex"}>
        <SideNavBar />
        <Outlet />
      </Box>
    </div>
  );
}
