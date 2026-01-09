import React, { useState } from "react";
import {
  Box,
  Paper,
  IconButton,
  Switch,
  Tooltip,
  InputBase,
} from "@mui/material";
import {
  LocationOn,
  LocationOff,
  Search as SearchIcon,
  AutoAwesomeTwoTone,
} from "@mui/icons-material";
import { useLocation } from "@/contexts/LocationContext";
import { BCDesignTokens } from "epic.theme";
import { AppConfig } from "@/utils/config";

const ACTION_BOX_SIZE = 48; // shared height for toggle + search

const SearchWithLocation: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const {
    isLocationEnabled,
    requestLocation,
    clearLocation,
    setLocationEnabled,
  } = useLocation();

  const handleSearch = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;

    const getStoredLocation = () => {
      try {
        const stored = localStorage.getItem("epic_search_user_location");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    };
    const locationData = isLocationEnabled ? getStoredLocation() : null;

    const params = new URLSearchParams();

    // Required fields
    params.set("keywords", trimmed);

    // Optional location
    if (locationData) {
      params.set("latitude", String(locationData.latitude));
      params.set("longitude", String(locationData.longitude));
      if (locationData.city) params.set("city", locationData.city);
      if (locationData.region) params.set("region", locationData.region);
      if (locationData.country) params.set("country", locationData.country);
    }

    // Build final URL
    const url = `${AppConfig.aiSearchURL}?${params.toString()}`;

    window.open(url, "_blank");
  };

  const handleToggleLocation = async () => {
    if (!isLocationEnabled) {
      setLocationEnabled(true);
      await requestLocation();
    } else {
      setLocationEnabled(false);
      clearLocation();
    }
  };

  return (
    <Box sx={{ padding: "16px 12px", width: "98%" }}>
      <Paper
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        sx={{
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: 1,
          padding: "8px 12px",
          border: "1px solid",
          borderColor: BCDesignTokens.themeBlue10,
          boxShadow: "0px 2px 6px -2px rgb(0 0 0 / 33%)",
          "&:hover, &:focus-within": {
            boxShadow: "0px 2px 18px 0px rgb(85 149 217 / 36%)",
          },
        }}
      >
        {/* AI Icon */}
        <IconButton
          sx={{
            borderRadius: "12px",
            width: ACTION_BOX_SIZE,
            height: ACTION_BOX_SIZE,
            "&:hover": {
              backgroundColor:
                BCDesignTokens.supportSurfaceColorSuccess,
            },
          }}
        >
          <AutoAwesomeTwoTone
            sx={{ fontSize: 24, color: BCDesignTokens.themeBlue100 }}
          />
        </IconButton>

        {/* Search Input */}
        <InputBase
          sx={{ flex: 1, height: ACTION_BOX_SIZE, px: 1 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Ask AI about documents..."
          inputProps={{ "aria-label": "search text" }}
        />

        {/* Location Toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: ACTION_BOX_SIZE,
            px: 1,
            gap: 0.5,
            background: BCDesignTokens.themeBlue10,
            borderRadius: "8px",
          }}
        >
          {isLocationEnabled ? (
            <LocationOn sx={{ fontSize: 20, color: "#013366" }} />
          ) : (
            <LocationOff sx={{ fontSize: 20, color: "#6B7280" }} />
          )}
          <Switch
            size="small"
            checked={isLocationEnabled}
            onChange={handleToggleLocation}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>

        {/* Search Button */}
        <Tooltip title="Search">
          <Box
            sx={{
              width: ACTION_BOX_SIZE,
              height: ACTION_BOX_SIZE,
              background: BCDesignTokens.themeBlue100,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton
              type="submit"
              aria-label="search"
              sx={{ width: "100%", height: "100%" }}
            >
              <SearchIcon sx={{ fontSize: 34, color: "#FFFFFF" }} />
            </IconButton>
          </Box>
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default SearchWithLocation;
