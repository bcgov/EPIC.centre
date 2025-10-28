import { PageLoader } from "@/components/PageLoader";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useEffect, useRef } from "react";
import { useInitializeUser } from "@/hooks/api/useUsers";

export const Route = createFileRoute("/oidc-callback")({
  component: OidcCallback,
});

function OidcCallback() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const {
    mutate: initializeUser,
    isIdle,
    isError: isInitError,
    isPending: isInitLoading,
  } = useInitializeUser();

  const hasCalled = useRef(false);

  useEffect(() => {
    if (!hasCalled.current && isAuthenticated && isIdle) {
      hasCalled.current = true;
      initializeUser();
    }
  }, [isAuthenticated, isIdle, initializeUser]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || isInitError) {
    return <Navigate to="/error" />;
  }

  if (!isLoading && isAuthenticated && !isInitLoading) {
    return <Navigate to="/launchpad" />;
  }

  return <PageLoader />;
}
