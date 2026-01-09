import { Paper } from "@mui/material";
import { Header } from "./Header";
import Body from "./Body";
import { BCDesignTokens } from "epic.theme";

export const AIDocumentSearch = () => {
  return (
    <Paper
      elevation={2}
      sx={{
        maxWidth: "1070px",
        boxShadow: BCDesignTokens.surfaceShadowMedium,
      }}
    >
      <Header />
      <Body />
    </Paper>
  );
};
