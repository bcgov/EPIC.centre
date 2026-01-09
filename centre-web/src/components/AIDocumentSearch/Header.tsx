import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const Header = () => {

  return (
    <Box
      sx={{
        height: "50px",
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
          <Typography variant="h4">BETA - AI Document Search</Typography>
        </Box>
      </Box>
    </Box>
  );
};
