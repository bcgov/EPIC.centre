import { EpicApp } from "@/models/EpicApp";
import { Box, Button, Divider } from "@mui/material";
import { AccessLogSection } from "../LaunchAppTile/AccessLogSection";

type BodyProps = {
  epicApp: EpicApp;
};

export const Body = ({ epicApp }: BodyProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px 12px 12px 12px",
        gap: "8px",
      }}
    >
      <Button variant="contained" fullWidth>
        Request Access
      </Button>
      <Box
        sx={{
          padding: "8px 0 12px 0",
        }}
      >
        <Divider
          sx={{
            width: "320px",
            backgroundColor: "#D1CFCD",
          }}
          aria-label="Bookmarks divider"
        />
      </Box>

      <Box width="100%">
        <AccessLogSection user={epicApp.user} />
      </Box>
    </Box>
  );
};
