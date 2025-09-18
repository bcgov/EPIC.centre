import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/unauthenticated")({
  component: Unauthenticated,
});

function Unauthenticated() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/login" });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div>You need to login to view this page. Redirecting to login...</div>
  );
}
