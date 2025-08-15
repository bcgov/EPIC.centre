import {
  Paper,
  Container,
  Stack,
  Button,
  Typography,
  Box,
  Link as MuiLink,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";

export default function ErrorPage() {
  return (
    <Container id="Error">
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
            Oops! Something unexpected happened.
          </Typography>
          <Box mx={4}>
            <Typography variant="body1">
              We encountered an error while processing your request. Please
              return to our home page and try again. If the problem persists,
              contact our support team at{" "}
              <MuiLink
                sx={{ ml: BCDesignTokens.layoutMarginXsmall }}
              >
              </MuiLink>
            </Typography>
          </Box>
          <Stack direction="row" justifyContent="center" spacing={2}>
            <Link to="/oidc-callback">
              <Button sx={{ width: "fit-content" }}>Return to Home Page</Button>
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
