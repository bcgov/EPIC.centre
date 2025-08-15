import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/logout")({
  component: Logout,
});

function Logout() {
  const { signoutSilent, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    signoutSilent();
  }, [signoutSilent]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({
        to: "/",
      });
    }
  }, [isAuthenticated, navigate]);

  return <p>...Loading</p>;
}
