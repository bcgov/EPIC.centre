import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if(isAuthenticated) {
    return <Navigate to="/oidc-callback" />
  }

  if(isLoading) {
    return <h1>Loading...</h1>;
  }

  return (
    <p>landing</p>
  );
}

