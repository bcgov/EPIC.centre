import { Alert, Typography } from "@mui/material";
import { ACCESS_LEVEL_WARNINGS } from "./constants";

type AccessLevelWarningProps = {
  groupPath: string;
};

export const AccessLevelWarning = ({ groupPath }: AccessLevelWarningProps) => {
  const warningConfig = ACCESS_LEVEL_WARNINGS[groupPath as keyof typeof ACCESS_LEVEL_WARNINGS];

  if (!warningConfig) {
    return null;
  }

  return (
    <Alert
      severity="info"
      sx={{ backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", mt: 2 }}
    >
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>{warningConfig.title}</strong> {warningConfig.mainMessage}
      </Typography>
      <Typography variant="body2">{warningConfig.additionalInfo}</Typography>
    </Alert>
  );
};
