import { Box, Typography } from "@mui/material";
import { LabeledItem } from "../Shared/LabeledItem";

type AccessLogSectionProps = {
  user: {
    access_level?: string | null;
    last_accessed?: string | null;
  };
};

export const AccessLogSection = ({ user }: AccessLogSectionProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <LabeledItem label="Access Level">
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Typography variant="body2">{user.access_level ?? ""}</Typography>
        </Box>
      </LabeledItem>
      <LabeledItem label="Last Accessed">
        <Typography variant="body2">{user.last_accessed ?? ""}</Typography>
      </LabeledItem>
    </Box>
  );
};
