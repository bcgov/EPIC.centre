import { Chip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type BadgeProps = Readonly<{
  label: string;
}>;
export function GreenBadge({ label }: BadgeProps) {
  return (
    <Chip
      sx={{
        borderRadius: 1,
        border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
        background: BCDesignTokens.supportSurfaceColorSuccess,
        height: "24px",
      }}
      label={label}
    />
  );
}
