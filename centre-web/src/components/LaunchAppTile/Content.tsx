import { Box, Button, Divider } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { EpicApp } from "@/models/EpicApp";
import { BookmarkSection } from "./BookmarkSection";
import { AccessLogSection } from "./AccessLogSection";
import { BCDesignTokens } from "epic.theme";

type ContentProps = {
  epicApp: EpicApp;
};
export const Content = ({ epicApp }: ContentProps) => {
  const { launch_url, is_public } = epicApp;
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          padding: "16px 12px 12px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          flex: 1,
        }}
      >
        <Button
          fullWidth
          endIcon={<OpenInNewIcon />}
          component="a"
          href={launch_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab
        </Button>
        <BookmarkSection epicApp={epicApp} />
        <Box
          sx={{
            padding: "8px 0 12px 0",
          }}
        >
          <Divider
            sx={{
              width: "320px",
              backgroundColor: BCDesignTokens.themeGray50,
            }}
          />
        </Box>
        {!is_public && (
          <Box sx={{ width: "100%", marginTop: "auto" }}>
            <AccessLogSection user={epicApp.user} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
