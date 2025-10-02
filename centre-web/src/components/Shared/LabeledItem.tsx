import { Stack, Typography, TypographyProps } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";

type LabeledItemProps = {
  label: string;
  children: React.ReactNode;
  labelProps?: TypographyProps;
};

export const LabeledItem = ({
  label,
  children,
  labelProps,
}: LabeledItemProps) => {
  const { sx = {}, ...restLabelProps } = labelProps ?? {};
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent={"space-between"}
      spacing={2}
    >
      <Typography
        variant="body2"
        color={BCDesignTokens.themeGray80}
        sx={{ ...sx }}
        {...restLabelProps}
      >
        {label}:
      </Typography>
      {children}
    </Stack>
  );
};
