import { PageLoader } from "@/components/PageLoader";

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading, signinRedirect } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      signinRedirect();
    }
  }, [isAuthenticated, isLoading, signinRedirect]);

  if (isAuthenticated) {
    return <Navigate to="/oidc-callback" />;
  }

  return <PageLoader />;
}
