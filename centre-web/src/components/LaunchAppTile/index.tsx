import { Paper } from "@mui/material";
import { Header } from "./Header";
import { Content } from "./Content";
import { EpicApp } from "@/models/EpicApp";
import { BCDesignTokens } from "epic.theme";

type LaunchAppTileProps = {
  item: EpicApp;
  dragListeners?: any;
  dragAttributes?: any;
  showDescription?: boolean;
};
export const LaunchAppTile = ({ item, dragListeners, dragAttributes, showDescription = true }: LaunchAppTileProps) => {
  return (
    <Paper
      elevation={2}
      sx={{
        width: "345px",
        height: showDescription ? "386px" : "340px",
        boxShadow: BCDesignTokens.surfaceShadowMedium,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header data={item} dragListeners={dragListeners} dragAttributes={dragAttributes} showDescription={showDescription} />
      <Content epicApp={item} />
    </Paper>
  );
};
