import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const Header = () => {
  return (
    <Box
      sx={{
        height: "81px",
        backgroundColor: BCDesignTokens.surfaceColorBackgroundLightBlue,
      }}
    >
      <Box
        sx={{
          padding: "4px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography variant="h6" component="div">
            Document Search
          </Typography>
        </Box>
        <Typography variant="body2" width="100%">
          Search all the documents in EPIC
        </Typography>
      </Box>
    </Box>
  );
};
