import { Grid, Typography } from "@mui/material";
import { NewRequestsTable } from "./NewRequestsTable";

export const NewAccessRequests = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5" fontWeight={"normal"}>
          New Access Requests
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <NewRequestsTable />
      </Grid>
    </Grid>
  );
};
