import { PageLoader } from "@/components/PageLoader";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import { useInitializeUser } from "@/hooks/api/useUsers";

export const Route = createFileRoute("/oidc-callback")({
  component: OidcCallback,
});

function OidcCallback() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const initializeUser = useInitializeUser();
  const [userInitialized, setUserInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (isAuthenticated && !userInitialized) {
        await initializeUser.mutateAsync();
        setUserInitialized(true);
      }
    };

    initialize();
  }, [isAuthenticated, userInitialized, initializeUser]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <Navigate to="/error" />;
  }

  if (!isLoading && isAuthenticated && userInitialized) {
    return <Navigate to="/launchpad" />;
  }

  return <PageLoader />;
}
