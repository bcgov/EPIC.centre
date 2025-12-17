import { Paper } from "@mui/material";
import { RequestAccessCatalog } from "@/models/EpicApp";
import { Body } from "./Body";
import { Header } from "./Header";
import { BCDesignTokens } from "epic.theme";

type RequestAccessTileProps = {
  data: RequestAccessCatalog;
};
export const RequestAccessTile = ({ data }: RequestAccessTileProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        maxWidth: "345px",
        height: "239px",
        boxShadow: BCDesignTokens.surfaceShadowMedium,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Header data={data} />
      <Body data={data} />
    </Paper>
  );
};
