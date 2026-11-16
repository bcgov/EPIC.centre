import { PageLoader } from "@/components/PageLoader";
import { LoadError } from "@/components/Shared/LoadError";
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
  const { user, isLoading: userLoading, isError, refetch } = useCurrentUser();
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

  // Record login once per session, under the username so "last accessed" finds it
  useEffect(() => {
    if (user?.username && !hasRecordedLogin.current) {
      hasRecordedLogin.current = true;
      recordLogin(
        { user_auth_guid: user.username, app_name: EPIC_CENTRE_APP_NAME },
        { onError: () => {} },
      );
    }
  }, [user?.username, recordLogin]);

  // Check the session, not isLoading: a token renewal sets isLoading, and showing
  // the loader then would remount the page (MAP-87).
  if (!isAuthenticated) {
    return isLoading ? <PageLoader /> : <Navigate to="/unauthenticated" />;
  }

  if (userLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <LoadError
        message="Unable to load your access settings. Please try again."
        onRetry={refetch}
      />
    );
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
