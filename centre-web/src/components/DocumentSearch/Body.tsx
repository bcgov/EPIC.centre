import { Box, Button, Divider, TextField } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { BookmarkSection } from "../LaunchAppTile/BookmarkSection";
import { EpicApp } from "@/models/EpicApp";
import { useState } from "react";
import { AppConfig } from "@/utils/config";

type DocumentSearchBodyProps = {
  epicApp?: EpicApp;
};

export const Body = ({ epicApp }: DocumentSearchBodyProps) => {
  const [searchText, setSearchText] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleViewSearchResults = () => {
    if (!searchText) return;
    window.open(
      `${AppConfig.documentSearchUrl}?keywords=${encodeURIComponent(searchText)}`,
      "_blank",
    );
  };

  return (
    <Box
      sx={{
        padding: "16px 12px 12px 12px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: "8px",
          width: "100%",
        }}
      >
        <TextField
          variant="outlined"
          fullWidth
          sx={{ mb: 0 }}
          value={searchText}
          onChange={handleSearchChange}
        />
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <Button
            endIcon={<OpenInNewIcon />}
            variant="contained"
            onClick={handleViewSearchResults}
          >
            View Search Results
          </Button>
        </Box>
        <Divider
          sx={{
            width: "100%",
            backgroundColor: "#D1CFCD",
          }}
        />
        <Box width={"100%"}>
          <BookmarkSection epicApp={epicApp} />
        </Box>
      </Box>
    </Box>
  );
};
