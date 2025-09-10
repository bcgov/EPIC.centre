import { EpicApp } from "@/models/EpicApp";
import { Grid } from "@mui/material";
import { LaunchAppTile } from ".";

type ListProps = {
  items: EpicApp[];
};
export const List = ({ items }: ListProps) => {
  return (
    <Grid container rowSpacing={4} spacing={2} direction={"row"}>
      {items.map((item) => (
        <Grid item key={item.id}>
          <LaunchAppTile item={item} />
        </Grid>
      ))}
    </Grid>
  );
};
