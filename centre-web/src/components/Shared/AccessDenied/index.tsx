import {
  Paper,
  Container,
  Stack,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";

export default function AccessDenied() {
  return (
    <Container id="AccessDenied">
      <Paper
        elevation={3}
        sx={{
          padding: "1rem",
          marginTop: "2rem",
          textAlign: "center",
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4">
            403 - Access Denied
          </Typography>

          <Box mx={4}>
            <Typography variant="body1">
              You do not have permission to access this page. This area is
              restricted to users with administrator roles in Epic applications.
            </Typography>
            <Typography variant="body1" sx={{ mt: BCDesignTokens.layoutMarginSmall }}>
              If you believe you should have access, please contact your system
              administrator.
            </Typography>
          </Box>

          <Stack direction="row" justifyContent="center" spacing={2}>
            <Link to="/request-access">
              <Button sx={{ width: "fit-content" }}>
                Return to Home Page
              </Button>
            </Link>
            <Link to="/logout">
              <Button sx={{ width: "fit-content" }} color="secondary">
                Logout
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

