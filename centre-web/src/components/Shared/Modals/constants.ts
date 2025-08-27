import { theme } from "@/styles/theme";
import { BCDesignTokens } from "epic.theme";

export const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "48%",
  transform: "translate(-50%, -50%)",
  bgcolor: BCDesignTokens.surfaceColorBackgroundWhite,
  boxShadow: 10,
  borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
  m: 1,
  overflowY: "scroll",
  color: theme.palette.text.primary,
};
