import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { CentreLink } from "../Shared/CentreLink";
import { EpicApp } from "@/models/EpicApp";
import { BookmarkSection } from "./BookmarkSection";

type LabeledItemProps = {
  label: string;
  children: React.ReactNode;
};

const LabeledItem = ({ label, children }: LabeledItemProps) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent={"space-between"}
      spacing={2}
    >
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      {children}
    </Stack>
  );
};

type ContentProps = {
  data: EpicApp;
};
export const Content = ({ data }: ContentProps) => {
  const { user, launch_url, name } = data;
  return (
    <Box sx={{ height: "331px" }}>
      <Box
        sx={{
          padding: "16px 12px 12px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "8px",
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
        <BookmarkSection bookmarks={user.bookmarks} name={name} />
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
          />
        </Box>
        <Box
          sx={{
            width: "185px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "0 8px",
          }}
        >
          <LabeledItem label="Access Level">
            <Typography variant="body2">{user.access_level ?? ""}</Typography>
          </LabeledItem>
          <LabeledItem label="Last Accessed">
            <Typography variant="body2">{user.last_accessed ?? ""}</Typography>
          </LabeledItem>
        </Box>
      </Box>
    </Box>
  );
};
