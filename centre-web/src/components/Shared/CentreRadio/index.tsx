import { FormControlLabel, Radio } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type CentreRadioProps = {
  value: string | number | boolean;
  label: string;
  error?: boolean;
  disabled?: boolean;
};
export const CentreRadio = ({
  value,
  label,
  error = false,
  disabled = false,
}: CentreRadioProps) => {
  const sx = [
    disabled && {
      color: `${BCDesignTokens.typographyColorDisabled} !important`,
    },
    error && {
      color: BCDesignTokens.surfaceColorPrimaryDangerButtonDefault,
    },
    {
      height: 32,
    },
  ];

  return (
    <FormControlLabel
      value={value}
      control={
        <Radio
          sx={{
            ...sx,
            "&.Mui-checked": { color: "#313132" },
          }}
          disabled={disabled}
        />
      }
      label={label}
      sx={{
        height: 32,
      }}
    />
  );
};
