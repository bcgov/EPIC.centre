import { Box, Paper, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type AuthPaperProps = {
  children: React.ReactNode;
};
export const AuthPaper = ({ children }: AuthPaperProps) => {
  return (
    <Paper elevation={3}>
      <Box
        sx={{
          padding: "12px 24px",
          borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        }}
      >
        <Typography variant="h3" fontWeight="bold">
          EPIC.auth
        </Typography>
      </Box>
      <Box sx={{ padding: 2 }}>{children}</Box>
    </Paper>
  );
};
