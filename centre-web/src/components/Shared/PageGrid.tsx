import { Box, BoxProps } from "@mui/material";

export const PageContainer = ({ children, ...rest }: BoxProps) => {
  return (
    <Box
      sx={{
        padding: "36px 24px",
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};
