import { PageLoader } from "@/components/PageLoader";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/oidc-callback")({
  component: OidcCallback,
});

function OidcCallback() {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <Navigate to="/error" />;
  }

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/launchpad" />;
  }

  return <Navigate to="/logout" />;
}
