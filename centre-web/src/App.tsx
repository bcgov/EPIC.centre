import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "react-oidc-context";
import { AppConfig, OidcConfig } from "@/utils/config";
import { theme } from "@/styles/theme";
import RouterProviderWithAuthContext from "@/router";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import ModalProvider from "./components/Shared/Modals/ModalProvider";
import SnackBarProvider from "./components/Shared/Snackbar/SnackBarProvider";
import { UserProvider } from "@/contexts/UserContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { isAxiosError } from "axios";

// A 4xx won't change on retry; anything else gets one more try
const retryOnce = (failureCount: number, error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 1;
};

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Most queries go through EPIC.auth, so refetch on navigation, not on every tab switch
        refetchOnWindowFocus: false,
        retry: retryOnce,
      },
    },
  });
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
    basepath: AppConfig.basepath ?? "/",
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider {...OidcConfig}>
          <LocationProvider>
            <UserProvider>
              <ModalProvider />
              <SnackBarProvider />
              <RouterProviderWithAuthContext router={router} />
            </UserProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
