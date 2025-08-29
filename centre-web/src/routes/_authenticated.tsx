import SideNavBar from "@/components/SideNav/SideNavBar";
import { OidcConfig } from "@/utils/config";
import { Box } from "@mui/material";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, signinRedirect } = context.authentication;
    if (!isAuthenticated) {
      signinRedirect({
        extraQueryParams: {
          kc_idp_hint: OidcConfig.kc_idp_hint,
        },
      });
    }
  },
  component: AuthenticatedRoute,
});

function AuthenticatedRoute() {
  return (
    <div>
      <Box flexDirection={"row"} display={"flex"}>
        <SideNavBar />
        <Outlet />
      </Box>
    </div>
  );
}
