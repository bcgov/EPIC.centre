import { Paper } from "@mui/material";
import { Header } from "./Header";
import { Content } from "./Content";
import { EpicApp } from "@/models/EpicApp";
import { BCDesignTokens } from "epic.theme";

type LaunchAppTileProps = {
  item: EpicApp;
};
export const LaunchAppTile = ({ item }: LaunchAppTileProps) => {
  return (
    <Paper
      elevation={2}
      sx={{
        width: "345px",
        height: "386px",
        boxShadow: BCDesignTokens.surfaceShadowMedium,
      }}
    >
      <Header data={item} />
      <Content epicApp={item} />
    </Paper>
  );
};
