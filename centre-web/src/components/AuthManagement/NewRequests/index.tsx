import { Button, Grid, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";
import { useAccessRequests } from "@/hooks/api/useAccessRequests";
import { RequestsTable } from "./RequestsTable";
import { AccessRequestStatus } from "@/models/AccessRequest";

export const NewRequests = () => {
  const [searchText, setSearchText] = useState("");

  const [queryParams, setQueryParams] = useState<{ search?: string }>({});
  const {
    data: requests = [],
    isLoading,
    isError,
  } = useAccessRequests({
    status: AccessRequestStatus.PENDING,
    params: queryParams,
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleSearchTrigger = () => {
    setQueryParams({ search: searchText });
  };

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
            onChange={handleSearchChange}
          />
          <Button
            sx={{
              width: "40px",
              height: "40px",
              minWidth: "40px",
            }}
            onClick={handleSearchTrigger}
          >
            <SearchIcon sx={{ height: "30px", width: "30px" }} />
          </Button>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <RequestsTable
          requests={requests}
          isLoading={isLoading}
          isError={isError}
          searchText={queryParams.search || ""}
        />
      </Grid>
    </Grid>
  );
};
