import { CentreLink } from "@/components/Shared/CentreLink";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { CentreUser } from "@/models/CentreUser";
import { Stack, TableRow } from "@mui/material";
import { getAppChipTitle } from "../../utils";
import { AppChip } from "@/components/Shared/AppChip";

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
