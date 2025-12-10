import { PageLoader } from "@/components/PageLoader";
import SideNavBar from "@/components/SideNav/SideNavBar";
import { useCurrentUser } from "@/contexts/UserContext";
import { OidcConfig } from "@/utils/config";
import { Box } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedRoute,
});

function AuthenticatedRoute() {
  const { isAuthenticated, signinRedirect, isLoading } = useAuth();
  const { isLoading: userLoading } = useCurrentUser();

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
