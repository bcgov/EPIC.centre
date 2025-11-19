import { FormControl, FormLabel, RadioGroup, Grid } from "@mui/material";
import { CentreRadio } from "@/components/Shared/CentreRadio";
import { AccessRequest } from "@/models/AccessRequest";
import { MODAL_OPTIONS } from "./constants";
import { getAppChipTitle } from "../utils";

type AccessLevel = {
  name: string;
  group_path: string;
  group_name: string;
};

type AccessLevelSelectionProps = {
  appName: string;
  accessLevels: AccessLevel[];
  selectedRole: string | null;
  currentRole: string | null;
  request?: AccessRequest;
  onRoleChange: (role: string) => void;
  disabledOptions?: string[];
};

export const AccessLevelSelection = ({
  appName,
  accessLevels,
  selectedRole,
  currentRole,
  request,
  onRoleChange,
  disabledOptions = [],
}: AccessLevelSelectionProps) => {
  return (
    <Grid item xs={12} mt={2}>
      <FormControl sx={{ margin: 0 }}>
        <FormLabel sx={{ fontWeight: "bold", color: "#000" }}>
          What access level would you like this user to have in{" "}
          {getAppChipTitle(appName)}?
        </FormLabel>
        <RadioGroup
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          {accessLevels.map((accessLevel) => (
            <CentreRadio
              key={accessLevel.name}
              value={accessLevel.group_path}
              label={accessLevel.name}
              disabled={disabledOptions.includes(accessLevel.group_path)}
            />
          ))}
          {currentRole && (
            <CentreRadio
              key={MODAL_OPTIONS.REVOKE.label}
              value={MODAL_OPTIONS.REVOKE.value}
              label={MODAL_OPTIONS.REVOKE.label}
            />
          )}
          {request && (
            <CentreRadio
              key={MODAL_OPTIONS.DENY.label}
              value={MODAL_OPTIONS.DENY.value}
              label={MODAL_OPTIONS.DENY.label}
            />
          )}
        </RadioGroup>
      </FormControl>
    </Grid>
  );
};
