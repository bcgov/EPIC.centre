import { AuthPaper } from "@/components/AuthManagement/AuthPaper";
import { UserAccess } from "@/components/AuthManagement/UserAccess";
import { PageContainer } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/request-access/auth/users/$userId",
)({
  component: AuthRequestAccess,
});

function AuthRequestAccess() {
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
