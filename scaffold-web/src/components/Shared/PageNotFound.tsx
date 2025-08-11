import { Paper, Container } from "@mui/material";
import { Link } from "@tanstack/react-router";

export default function PageNotFound() {
  return (
    <Container id="Error404">
      <Paper
        elevation={3}
        sx={{
          padding: "1rem",
          marginTop: "2rem",
          textAlign: "center",
        }}
      >
        <h1>404</h1>
        <p>Sorry, page not found.</p>
        <Link to={"/"}>Go Home</Link>
      </Paper>
    </Container>
  );
}
