import { Paper } from "@mui/material";
import { Header } from "./Header";
import { Content } from "./Content";
import { EpicApp } from "@/models/EpicApp";
import { BCDesignTokens } from "epic.theme";
import { useLaunchpadStore } from "@/stores/launchpadStore";

type LaunchAppTileProps = {
  item: EpicApp;
  dragListeners?: any;
  dragAttributes?: any;
};
export const LaunchAppTile = ({ item, dragListeners, dragAttributes }: LaunchAppTileProps) => {
  const { showDescription } = useLaunchpadStore();
  
  return (
    <Paper
      elevation={2}
      sx={{
        width: "100%",
        maxWidth: "345px",
        height: showDescription ? "386px" : "340px",
        boxShadow: BCDesignTokens.surfaceShadowMedium,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Header data={item} dragListeners={dragListeners} dragAttributes={dragAttributes} />
      <Content epicApp={item} />
    </Paper>
  );
};
