import { BCDesignTokens } from "epic.theme";

const borderColor = BCDesignTokens.surfaceColorBorderDefault;

/** Label/placeholder color for Application and Access level dropdowns (match search field: #9F9D9C). */
export const dropdownLabelSx = {
  "& .MuiInputLabel-root": {
    color: "#9F9D9C",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#9F9D9C",
  },
};

/** Border styles for Application and Access level dropdowns (match search field). */
export const dropdownInputSx = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: "1px !important",
    borderColor: `${borderColor} !important`,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: `${borderColor} !important`,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderWidth: "1px !important",
    borderColor: `${borderColor} !important`,
  },
};

/** Disabled state for Access level dropdown (light gray background). Applied on FormControl so it targets the input inside. */
export const disabledAccessLevelFormControlSx = {
  "& .MuiInputBase-root.Mui-disabled": {
    backgroundColor: "#f5f5f5 !important",
  },
  "& .Mui-disabled.MuiInputBase-root": {
    backgroundColor: "#f5f5f5 !important",
  },
  "& .MuiOutlinedInput-root.Mui-disabled": {
    backgroundColor: "#f5f5f5 !important",
  },
  "& .MuiInputBase-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e0e0e0",
  },
};
