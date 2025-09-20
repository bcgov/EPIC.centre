import { Box } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";
import { YellowBar } from "./YellowBar";

type BarTitleProps = Readonly<{
  children: React.ReactNode;
}>;
export default function BarTitle({ children }: BarTitleProps) {
  return (
    <Box sx={{ mt: BCDesignTokens.layoutMarginMedium }}>
      <YellowBar />
      {children}
    </Box>
  );
}
