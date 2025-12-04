import { Box, Typography } from "@mui/material";
import { LabeledItem } from "../Shared/LabeledItem";

type AccessLogSectionProps = {
  user: {
    access_level?: string | null;
    last_accessed?: string | null;
  };
};

const formatLastAccessed = (isoDateString: string | null | undefined): string => {
  if (!isoDateString) return "";
  const date = new Date(isoDateString);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const AccessLogSection = ({ user }: AccessLogSectionProps) => {
  return (
    <Box
      sx={{
        width: "80%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <LabeledItem 
        label="Access Level"
        labelProps={{ sx: { minWidth: "100px" } }}
      >
        <Typography variant="body2">{user.access_level ?? ""}</Typography>
      </LabeledItem>
      <LabeledItem 
        label="Last Accessed"
        labelProps={{ sx: { minWidth: "100px" } }}
      >
        <Typography variant="body2">{formatLastAccessed(user.last_accessed)}</Typography>
      </LabeledItem>
    </Box>
  );
};
