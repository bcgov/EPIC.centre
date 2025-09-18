import { CentreLink } from "@/components/Shared/CentreLink";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { CentreUser } from "@/models/CentreUser";
import { TableRow } from "@mui/material";

type Props = {
  readonly user: CentreUser;
};
export default function UsersTableRow({ user }: Props) {
  return (
    <TableRow>
      <CentreTableCell>{`${user.last_name}, ${user.first_name}`}</CentreTableCell>
      <CentreTableCell>{user.apps.join(", ")}</CentreTableCell>
      <CentreTableCell>
        <CentreLink>View/Edit Access</CentreLink>
      </CentreTableCell>
    </TableRow>
  );
}
