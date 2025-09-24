import { Grid, Typography } from "@mui/material";
import { CurrentAccessTable } from "./CurrentAccessTable";
import { CentreUser } from "@/models/CentreUser";

type CurrentAccessLevelProps = {
  user?: CentreUser;
};
export const CurrentAccessLevel = ({ user }: CurrentAccessLevelProps) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5" fontWeight={"normal"}>
          Current Access Level
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <CurrentAccessTable user={user} />
      </Grid>
    </Grid>
  );
};
