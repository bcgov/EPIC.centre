import HomePage from "@/components/Home/HomePage";
import { PageLoader } from "@/components/PageLoader";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const {isLoading, signinRedirect } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }



  return <HomePage onSignIn={() => signinRedirect()} />;
}
