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
    const handleLogout = async () => {

        await signoutSilent();
        navigate({ to: "/", replace: true });
      
    };

    void handleLogout();
  }, [navigate, signoutSilent]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, navigate]);

  return null;
}
