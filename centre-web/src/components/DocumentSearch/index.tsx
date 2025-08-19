import { Paper } from "@mui/material";
import { Header } from "./Header";
import { Body } from "./Body";

export const DocumentSearch = () => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
      }}
    >
      <Header />
      <Body />
    </Paper>
  );
};
