import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";

type RouterProviderWithAuthContextProps = Readonly<{
  router: any;
}>;
export default function RouterProviderWithAuthContext({
  router,
}: RouterProviderWithAuthContextProps) {
  const authentication = useAuth();
  useEffect(() => {
    // the `return` is important - addAccessTokenExpiring() returns a cleanup function

    return authentication.events.addAccessTokenExpiring(() => {
      // eslint-disable-next-line no-console
      console.log("AccessTokenExpiring: Refreshing token");
      authentication.signinSilent();
    });
  }, [authentication]);

  useEffect(() => {
    if (authentication.user?.expired && authentication.isAuthenticated) {
      // eslint-disable-next-line no-console
      console.log("AccessToken expired");
      window.location.href = window.location.origin + "/logout";
    }
  }, [authentication.user?.expired, authentication.isAuthenticated]);

  return <RouterProvider router={router} context={{ authentication }} />;
}
