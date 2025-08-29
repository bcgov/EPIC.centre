import { Paper } from "@mui/material";
import { EpicApp } from "@/models/EpicApp";
import { Header } from "../LaunchAppTile/Header";
import { Body } from "./Body";

type RequestAccessTileProps = {
  epicApp: EpicApp;
};
export const RequestAccessTile = ({ epicApp }: RequestAccessTileProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "345px",
      }}
    >
      <Header data={epicApp} />
      <Body epicApp={epicApp} />
    </Paper>
  );
};
