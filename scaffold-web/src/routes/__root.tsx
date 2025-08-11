import EAOAppBar from "@/components/Shared/EAOAppBar";
import PageNotFound from "@/components/Shared/PageNotFound";
import SideNavBar from "@/components/Shared/SideNavBar";
import { Box } from "@mui/system";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthContextProps } from "react-oidc-context";

type RouterContext = {
  authentication: AuthContextProps;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Layout,
  notFoundComponent: PageNotFound,
});

function Layout() {
  return (
    <>
      <EAOAppBar />
      <Box display={"flex"}>
        <SideNavBar />
        <Box
          display={"flex"}
          flexDirection={"column"}
          flex={1}
          padding={"1rem"}
        >
          <Outlet />
        </Box>
      </Box>
      <TanStackRouterDevtools />
    </>
  );
}
