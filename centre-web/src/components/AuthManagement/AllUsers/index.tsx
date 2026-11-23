import {
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import { useEffect, useMemo, useState } from "react";
import { UsersTable } from "./UsersTable";
import { useCurrentUser } from "@/contexts/UserContext";
import {
  disabledAccessLevelFormControlSx,
  dropdownInputSx,
  dropdownLabelSx,
} from "@/components/Shared/filterDropdownStyles";
import { useGetUsers } from "@/hooks/api/useUsers";
import { CentreUserListItem } from "@/models/CentreUser";
import { ALL_USERS_FILTER_APP_NAMES } from "@/models/EpicApp";
import { getAppChipTitle } from "../utils";
import { useGeteApplicationAccessLevels } from "@/hooks/api/useApplications";



const DROPDOWN_MIN_WIDTH = 250;

const ALL_VALUE = "";

const MIN_AUTO_SEARCH_LENGTH = 3;

/** Normalize group path for comparison (Keycloak may return paths with leading/trailing slashes or different casing). */
function normalizeGroupPath(path: string | null | undefined): string {
  if (path == null || path === "") return "";
  return path.replace(/(^(?:\/)+)|((?:\/)+$)/g, "").toUpperCase();
}

/** search must already be lowercase. */
function matchesSearch(user: CentreUserListItem, search: string): boolean {
  const first = user.first_name ?? "";
  const last = user.last_name ?? "";
  return [first, last, `${first} ${last}`, `${last}, ${first}`, user.username].some(
    (value) => value.toLowerCase().includes(search),
  );
}

export const AllUsers = () => {
  const { isDstAdmin } = useCurrentUser();
  const [searchText, setSearchText] = useState("");
  const [selectedAppName, setSelectedAppName] = useState<string>(ALL_VALUE);
  const [selectedAccessLevelGroupPath, setSelectedAccessLevelGroupPath] =
    useState<string>(ALL_VALUE);

  const [search, setSearch] = useState("");
  // Groups are slow in EPIC.auth, so only fetch them to filter by app
  const {
    data: users = [],
    isLoading,
    isError,
  } = useGetUsers({ include_groups: !!selectedAppName });

  const { data: rawAccessLevels = [] } = useGeteApplicationAccessLevels({
    appName: selectedAppName,
    enabled: !!selectedAppName,
  });
  const accessLevels = useMemo(
    () => (selectedAppName ? rawAccessLevels : []),
    [selectedAppName, rawAccessLevels],
  );

  // When the selected app has only one access level, default to it (e.g. Cond. Repo. → Admin)
  useEffect(() => {
    if (!selectedAppName) {
      return;
    }
    if (accessLevels.length === 1) {
      setSelectedAccessLevelGroupPath(accessLevels[0].group_path);
    }
  }, [selectedAppName, accessLevels]);

  // Search and filters run on the loaded list, so searching makes no request
  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedSelectedPath = selectedAccessLevelGroupPath
      ? normalizeGroupPath(selectedAccessLevelGroupPath)
      : null;
    return users.filter((user) => {
      if (normalizedSearch && !matchesSearch(user, normalizedSearch)) {
        return false;
      }
      if (!selectedAppName) {
        return true;
      }
      const hasAppAccess = user.apps?.some((app) => app.name === selectedAppName);
      if (!hasAppAccess) return false;
      if (normalizedSelectedPath) {
        return (
          user.group_paths?.some(
            (path) => normalizeGroupPath(path) === normalizedSelectedPath,
          ) ?? false
        );
      }
      return true;
    });
  }, [users, search, selectedAppName, selectedAccessLevelGroupPath]);

  // Enter or the button still searches shorter names, e.g. "Li"
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    setSearch(value.trim().length >= MIN_AUTO_SEARCH_LENGTH ? value : "");
  };

  const handleSearchTrigger = () => {
    setSearch(searchText);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setSearch("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearchTrigger();
    }
  };

  const handleAppChange = (value: string) => {
    setSelectedAppName(value);
    setSelectedAccessLevelGroupPath(ALL_VALUE);
  };

  return (
    <Grid container spacing={2} mt={"1em"}>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
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
              "& .MuiInputBase-input::placeholder": {
                color: "#9F9D9C",
                opacity: 1,
              },
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
          {isDstAdmin && (
            <>
              <FormControl
                size="small"
                sx={{ minWidth: DROPDOWN_MIN_WIDTH, ...dropdownLabelSx }}
              >
                <InputLabel id="all-users-app-filter-label">
                  Application
                </InputLabel>
                <Select
                  labelId="all-users-app-filter-label"
                  value={selectedAppName}
                  label="Application"
                  onChange={(e) => handleAppChange(e.target.value)}
                  sx={dropdownInputSx}
                >
                  <MenuItem value={ALL_VALUE}>All</MenuItem>
                  {ALL_USERS_FILTER_APP_NAMES.map((name) => (
                    <MenuItem key={name} value={name}>
                      {getAppChipTitle(name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                size="small"
                sx={{
                  minWidth: DROPDOWN_MIN_WIDTH,
                  ...dropdownLabelSx,
                  ...disabledAccessLevelFormControlSx,
                }}
                disabled={!selectedAppName}
              >
                <InputLabel id="all-users-access-level-filter-label">
                  Access level
                </InputLabel>
                <Select
                  labelId="all-users-access-level-filter-label"
                  value={selectedAccessLevelGroupPath}
                  label="Access level"
                  onChange={(e) =>
                    setSelectedAccessLevelGroupPath(e.target.value)
                  }
                  sx={{
                    ...dropdownInputSx,
                    "&.Mui-disabled": {
                      backgroundColor: "#f5f5f5 !important",
                    },
                  }}
                >
                  <MenuItem value={ALL_VALUE}>All</MenuItem>
                  {accessLevels.map((level) => (
                    <MenuItem key={level.group_path} value={level.group_path}>
                      {level.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <UsersTable
          users={filteredUsers}
          isLoading={isLoading}
          isError={isError}
          searchText={search}
        />
      </Grid>
    </Grid>
  );
};
