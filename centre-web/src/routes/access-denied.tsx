import { createFileRoute } from "@tanstack/react-router";
import AccessDenied from "@/components/Shared/AccessDenied";

export const Route = createFileRoute("/access-denied")({
  component: AccessDeniedPage,
  meta: () => [{ title: "Access Denied" }],
});

function AccessDeniedPage() {
  return <AccessDenied />;
}
