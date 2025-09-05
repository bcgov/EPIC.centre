import { Paper } from "@mui/material";
import { RequestAccessCatalog } from "@/models/EpicApp";
import { Body } from "./Body";
import { Header } from "./Header";

type RequestAccessTileProps = {
  data: RequestAccessCatalog;
};
export const RequestAccessTile = ({ data }: RequestAccessTileProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "345px",
      }}
    >
      <Header data={data} />
      <Body data={data} />
    </Paper>
  );
};
