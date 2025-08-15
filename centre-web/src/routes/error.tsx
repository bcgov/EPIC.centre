import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import ErrorPageContent from "@/components/ErrorPageContent";

export const Route = createFileRoute("/error")({
  component: ErrorPage,
  meta: () => [{ title: "Error" }],
});

function ErrorPage() {
  const { user } = useAuth();

  if (user?.expired) {
    return <Navigate to="/logout" />;
  }

  return <ErrorPageContent />;
}
