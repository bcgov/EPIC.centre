import { Button, Grid, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { UsersTable } from "./UsersTable";

export const AllUsers = () => {
  return (
    <Grid container spacing={2} mt={"1em"}>
      <Grid item xs={12}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            variant="outlined"
            placeholder="Search users by name"
            InputProps={{
              startAdornment: (
                <SearchIcon
                  sx={{ color: "#7B90A7", height: "30px", width: "30px" }}
                />
              ),
            }}
            sx={{
              width: "400px",
            }}
          />
          <Button
            sx={{
              width: "40px",
              height: "40px",
              minWidth: "40px",
            }}
          >
            <SearchIcon sx={{ height: "30px", width: "30px" }} />
          </Button>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <UsersTable />
      </Grid>
    </Grid>
  );
};
