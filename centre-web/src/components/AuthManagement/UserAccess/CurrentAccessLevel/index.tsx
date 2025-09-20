import { Grid, Typography } from "@mui/material";
import { CurrentAccessTable } from "./CurrentAccessTable";

export const CurrentAccessLevel = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5" fontWeight={"normal"}>
          Current Access Level
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <CurrentAccessTable />
      </Grid>
    </Grid>
  );
};
