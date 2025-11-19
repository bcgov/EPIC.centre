import { RequestAccessCatalog } from "@/models/EpicApp";
import { Grid } from "@mui/material";
import { RequestAccessTile } from ".";

type ListProps = {
  items: RequestAccessCatalog[];
};
export const List = ({ items }: ListProps) => {
  return (
    <Grid container  rowSpacing={4} spacing={2} direction={"row"} sx={{ maxWidth: '1100px' }}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={4} lg={4} key={item.id}>
          <RequestAccessTile data={item} />
        </Grid>
      ))}
    </Grid>
  );
};
