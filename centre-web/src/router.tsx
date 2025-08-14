import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { useAuth } from "react-oidc-context";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    // authentication will initially be undefined
    // We'll be passing down the authentication state from within a React component
    authentication: undefined!,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function RouterProviderWithAuthContext() {
  const authentication = useAuth();
  return <RouterProvider router={router} context={{ authentication }} />
}
