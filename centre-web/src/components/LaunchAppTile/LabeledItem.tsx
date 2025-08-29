import { Stack, Typography } from "@mui/material";
import React from "react";

type LabeledItemProps = {
  label: string;
  children: React.ReactNode;
};

export const LabeledItem = ({ label, children }: LabeledItemProps) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent={"space-between"}
      spacing={2}
    >
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      {children}
    </Stack>
  );
};
