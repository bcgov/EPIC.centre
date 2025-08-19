import { EpicApp } from "@/models/EpicApp";
import { Grid } from "@mui/material";
import { LaunchAppTile } from ".";

type ListProps = {
  items: EpicApp[];
};
export const List = ({ items }: ListProps) => {
  return (
    <Grid container spacing={4} direction={"row"}>
      {items.map((item) => (
        <Grid item key={item.app_id}>
          <LaunchAppTile item={item} />
        </Grid>
      ))}
    </Grid>
  );
};
