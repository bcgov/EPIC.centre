import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/oidc-callback")({
  component: OidcCallback,
});

function OidcCallback() {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return <h1>Redirecting, Please wait...</h1>;
  }

  if (error?.message) {
    return <h1>Error: {error.message}</h1>;
  }

  if(!isLoading && isAuthenticated) {
    return <Navigate to="/"></Navigate>
  }
}
