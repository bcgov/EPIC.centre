import { Paper } from "@mui/material";
import { Header } from "./Header";
import { Body } from "./Body";
import { EpicApp } from "@/models/EpicApp";
import { BCDesignTokens } from "epic.theme";

type DocumentSearch = {
  epicApp?: EpicApp;
};
export const DocumentSearch = ({ epicApp }: DocumentSearch) => {
  return (
    <Paper
      elevation={2}
      sx={{
        maxWidth: "1070px",
        boxShadow: BCDesignTokens.surfaceShadowMedium,
      }}
    >
      <Header />
      <Body epicApp={epicApp} />
    </Paper>
  );
};
