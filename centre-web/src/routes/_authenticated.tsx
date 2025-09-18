import { PageLoader } from "@/components/PageLoader";
import SideNavBar from "@/components/SideNav/SideNavBar";
import { OidcConfig } from "@/utils/config";
import { Box } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, signinRedirect, isLoading } =
      context.authentication;
    if (!isAuthenticated && !isLoading) {
      signinRedirect({
        redirect_uri: window.location.href,
        extraQueryParams: {
          kc_idp_hint: OidcConfig.extraQueryParams?.kc_idp_hint || "",
        },
      });
    }
  },
  component: AuthenticatedRoute,
});

function AuthenticatedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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
