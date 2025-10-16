import { Button, Grid, IconButton, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import { UsersTable } from "./UsersTable";
import { useGetUsers } from "@/hooks/api/useUsers";
import { useState } from "react";

export const AllUsers = () => {
  const [searchText, setSearchText] = useState("");

  const [queryParams, setQueryParams] = useState<{
    search?: string;
    include_groups?: boolean;
  }>({});
  const {
    data: users = [],
    isLoading,
    isError,
  } = useGetUsers({
    ...queryParams,
    include_groups: false,
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleSearchTrigger = () => {
    setQueryParams({ search: searchText });
  };

  const handleClearSearch = () => {
    setSearchText("");
    setQueryParams({ search: "" });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearchTrigger();
    }
  };

  return (
    <Grid container spacing={2} mt={"1em"}>
      <Grid item xs={12}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            variant="outlined"
            placeholder="Enter the first three letters of the user’s First or Last name"
            value={searchText}
            InputProps={{
              startAdornment: (
                <SearchIcon
                  sx={{ color: "#7B90A7", height: "30px", width: "30px" }}
                />
              ),
              endAdornment: searchText && (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{
                    padding: "4px",
                  }}
                >
                  <CancelIcon
                    sx={{ color: "#7B90A7", height: "24px", width: "24px" }}
                  />
                </IconButton>
              ),
            }}
            sx={{
              width: "520px",
            }}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
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
        <UsersTable
          users={users}
          isLoading={isLoading}
          isError={isError}
          searchText={queryParams.search || ""}
        />
      </Grid>
    </Grid>
  );
};
