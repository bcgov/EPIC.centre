import { ThemeProvider } from "@mui/material";
import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "react-oidc-context";
import { OidcConfig } from "@/utils/config";
import { theme } from "@/styles/theme";
import RouterProviderWithAuthContext from "@/router";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import ModalProvider from "./components/Modals/ModalProvider";

function App() {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: {
      // authentication will initially be undefined
      // We'll be passing down the authentication state from within a React component
      authentication: undefined!,
      queryClient,
    },
    defaultPreload: "intent",
    // Since we're using React Query, we don't want loader calls to ever be stale
    // This will ensure that the loader is always called when the route is preloaded or visited
    defaultPreloadStaleTime: 0,
    notFoundMode: "root",
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider {...OidcConfig}>
          <ModalProvider />
          <RouterProviderWithAuthContext router={router} />
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
