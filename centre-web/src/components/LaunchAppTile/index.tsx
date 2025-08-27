import { Paper } from "@mui/material";
import { Header } from "./Header";
import { Content } from "./Content";
import { EpicApp } from "@/models/EpicApp";

type LaunchAppTileProps = {
  item: EpicApp;
};
export const LaunchAppTile = ({ item }: LaunchAppTileProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "345px",
      }}
    >
      <Header data={item} />
      <Content epicApp={item} />
    </Paper>
  );
};
