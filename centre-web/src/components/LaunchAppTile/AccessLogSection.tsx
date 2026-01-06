import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { LabeledItem } from "../Shared/LabeledItem";

dayjs.extend(utc);

type AccessLogSectionProps = {
  user: {
    access_level?: string | null;
    last_accessed?: string | null;
  };
};

const formatLastAccessed = (isoDateString: string | null | undefined): string => {
  if (!isoDateString) return "";
  const date = dayjs.utc(isoDateString);
  if (!date.isValid()) return "";
  return date.local().format("YYYY-MM-DD");
};

export const AccessLogSection = ({ user }: AccessLogSectionProps) => {
  return (
    <Box
      sx={{
        width: "80%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-start",
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
