import { Paper } from "@mui/material";
import { Header } from "./Header";
import { Body } from "./Body";
import { EpicApp } from "@/models/EpicApp";

type DocumentSearch = {
  epicApp?: EpicApp;
};
export const DocumentSearch = ({ epicApp }: DocumentSearch) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
      }}
    >
      <Header />
      <Body epicApp={epicApp} />
    </Paper>
  );
};
