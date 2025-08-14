import {
  Button,
  Card,
  CardContent,
  Typography,
  CardActions,
  Chip,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

function Profile() {
  const { isAuthenticated, user, signoutSilent } = useAuth();

  if (!isAuthenticated) {
    return <h3>You are not authorized</h3>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" color="primary" fontWeight={600} gutterBottom>
          {user?.profile.name}{" "}
          <Chip
            label={user?.profile.identity_provider?.toString()}
            color="secondary"
          />
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="primary">
          email id: {user?.profile.email}
        </Typography>
        <Typography variant="body2">
          preferred_username : <br /> {user?.profile.preferred_username}
        </Typography>
      </CardContent>
      <CardActions>
        <Button onClick={() => signoutSilent()}>Sign out</Button>
      </CardActions>
    </Card>
  );
}
