import { CentreLink } from "@/components/Shared/CentreLink";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { CentreUser } from "@/models/CentreUser";
import { Box, Stack, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { getAppChipTitle } from "../../utils";

type AppChipProps = {
  appName: string;
};
const AppChip = ({ appName }: AppChipProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: "2px",
      height: "24px",
      border: BCDesignTokens.supportBorderColorInfo,
      backgroundColor: BCDesignTokens.surfaceColorPrimaryButtonDefault,
      color: BCDesignTokens.surfaceColorBackgroundWhite,
    }}
  >
    {appName}
  </Box>
);

type Props = {
  readonly user: CentreUser;
};
export default function UsersTableRow({ user }: Props) {
  return (
    <TableRow>
      <CentreTableCell>{`${user.last_name ?? ""}, ${user.first_name ?? ""}`}</CentreTableCell>
      <CentreTableCell sx={{ height: "35px" }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {user.apps.map((app) => (
            <AppChip key={app} appName={getAppChipTitle(app)} />
          ))}
        </Stack>
      </CentreTableCell>
      <CentreTableCell>
        <CentreLink>View/Edit Access</CentreLink>
      </CentreTableCell>
    </TableRow>
  );
}
