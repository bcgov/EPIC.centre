import { Box, BoxProps } from "@mui/material";

type CentreTabPanelProps = BoxProps & {
  index?: number;
  value?: number;
};
export const CentreTabPanel = (props: CentreTabPanelProps) => {
  const { children, index, value, ...rest } = props;

  if (value !== index) {
    return null;
  }

  return (
    <Box role="tabpanel" {...rest}>
      {children}
    </Box>
  );
};
