import PageNotFound from "@/components/Shared/PageNotFound";
import { Box } from "@mui/system";
import {
  CatchBoundary,
  createRootRouteWithContext,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthContextProps } from "react-oidc-context";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient } from "@tanstack/react-query";
import { AppConfig } from "@/utils/config";
import EAOAppBar from "@/components/Layout/EAOAppBar";
import { When } from "react-if";
import Footer from "@/components/Layout/Footer";

type RouterContext = {
  authentication: AuthContextProps;
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Layout,
  notFoundComponent: PageNotFound,
});

function Layout() {
  const isLocal = AppConfig.environment === "local";
  const navigate = useNavigate();

  return (
    <CatchBoundary
      getResetKey={() => "reset"}
      onCatch={() => navigate({ to: "/error" })}
    >
      <EAOAppBar />
      <Box minHeight={"calc(100vh - 88px)"}>
        <Outlet />
      </Box>
      <Footer />
      <When condition={isLocal}>
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools initialIsOpen={false} />
      </When>
    </CatchBoundary>
  );
}
