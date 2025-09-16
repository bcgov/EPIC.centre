import { Box, BoxProps } from "@mui/material";

export const PageContainer = ({ children, ...rest }: BoxProps) => {
  const { sx, ...other } = rest;
  return (
    <Box
      sx={{
        padding: "36px 24px",
        width: "100%",
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
};
