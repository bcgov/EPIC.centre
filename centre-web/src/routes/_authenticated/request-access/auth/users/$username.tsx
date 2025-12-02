import { AuthPaper } from "@/components/AuthManagement/AuthPaper";
import { UserAccess } from "@/components/AuthManagement/UserAccess";
import { PageContainer } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/contexts/UserContext";

export const Route = createFileRoute(
  "/_authenticated/request-access/auth/users/$username",
)({
  component: AuthRequestAccess,
});

function AuthRequestAccess() {
  const { isAdmin } = useCurrentUser();

  // Check if user has Administrator role
  if (!isAdmin) {
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
