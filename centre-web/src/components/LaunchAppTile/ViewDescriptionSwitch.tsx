import { Switch, FormControlLabel } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useLaunchpadStore } from "@/stores/launchpadStore";
import { useCallback } from "react";

export const ViewDescriptionSwitch = () => {
  const { showDescription, setShowDescription } = useLaunchpadStore();

  const handleToggleChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setShowDescription(checked);
    },
    [setShowDescription]
  );

  return (
    <FormControlLabel
      control={
        <Switch
          checked={showDescription}
          onChange={handleToggleChange}
          name="view-description"
          sx={{
            "& .MuiSwitch-thumb": {
              backgroundColor: "#ffffff",
              border: `1px solid ${BCDesignTokens.themeGray50}`,
            },
            "& .MuiSwitch-track": {
              backgroundColor: "#e6e3e3",
              opacity: 1,
            },
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "#ffffff",
              "& .MuiSwitch-thumb": {
                backgroundColor: "#ffffff",
                border: "none",
              },
              "& + .MuiSwitch-track": {
                backgroundColor: BCDesignTokens.themeBlue90,
                opacity: 1,
              },
            },
          }}
        />
      }
      label="View Description"
    />
  );
};

