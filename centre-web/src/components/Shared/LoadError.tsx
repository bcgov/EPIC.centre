import { Alert, Box, Button } from "@mui/material";

type LoadErrorProps = {
  message: string;
  onRetry: () => void;
};

export const LoadError = ({ message, onRetry }: LoadErrorProps) => (
  <Box sx={{ p: 3 }}>
    <Alert
      severity="error"
      action={<Button onClick={() => onRetry()}>Try again</Button>}
    >
      {message}
    </Alert>
  </Box>
);
