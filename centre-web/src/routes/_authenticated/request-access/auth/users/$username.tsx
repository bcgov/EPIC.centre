import { AuthPaper } from "@/components/AuthManagement/AuthPaper";
import { UserAccess } from "@/components/AuthManagement/UserAccess";
import { PageContainer } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { isAdministrator } from "@/utils/roleUtils";

export const Route = createFileRoute(
  "/_authenticated/request-access/auth/users/$username",
)({
  component: AuthRequestAccess,
});

function AuthRequestAccess() {
  const { user } = useAuth();

  // Check if user has Administrator role
  if (!isAdministrator(user?.access_token)) {
    return <Navigate to="/access-denied" />;
  }

  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <AuthPaper>
            <UserAccess />
          </AuthPaper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
