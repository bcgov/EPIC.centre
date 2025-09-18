import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type AppChipProps = {
  appName: string;
};
export const AppChip = ({ appName }: AppChipProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: "2px",
      height: "24px",
      border: BCDesignTokens.supportBorderColorInfo,
      backgroundColor: BCDesignTokens.surfaceColorPrimaryButtonDefault,
      color: BCDesignTokens.surfaceColorBackgroundWhite,
    }}
  >
    <Typography variant="body2" color={"inherit"}>
      {appName}
    </Typography>
  </Box>
);
