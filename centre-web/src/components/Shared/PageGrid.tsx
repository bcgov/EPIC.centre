import { Grid, GridProps } from "@mui/material";

export const PageGrid = ({ children, ...rest }: GridProps) => {
  return (
    <Grid
      container
      spacing={2}
      sx={{
        padding: "36px 24px",
      }}
      {...rest}
    >
      {children}
    </Grid>
  );
};
