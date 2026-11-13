import HomePage from "@/components/Home/HomePage";
import { PageLoader } from "@/components/PageLoader";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  // The welcome page is only for signed-out visitors
  if (isAuthenticated) {
    return <Navigate to="/launchpad" replace />;
  }

  return <HomePage />;
}
