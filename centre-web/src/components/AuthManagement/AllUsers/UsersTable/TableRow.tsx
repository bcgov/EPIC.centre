import { CentreLink } from "@/components/Shared/CentreLink";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { CentreUser } from "@/models/CentreUser";
import { TableRow } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";

type Props = {
  readonly user: CentreUser;
};
export default function UsersTableRow({ user }: Props) {
  const navigate = useNavigate();

  const handleEditAccess = () => {
    navigate({
      to: "/request-access/auth/users/$username",
      params: { username: user.username },
    });
  };

  return (
    <TableRow>
      <CentreTableCell>{`${user.last_name ?? ""}, ${user.first_name ?? ""}`}</CentreTableCell>
      {/* <CentreTableCell sx={{ height: "35px" }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {user.apps.map((app) => (
            <AppChip key={app.name} appName={getAppChipTitle(app.name)} />
          ))}
        </Stack>
      </CentreTableCell> */}
      <CentreTableCell>
        <CentreLink onClick={handleEditAccess}>View/Edit Access</CentreLink>
      </CentreTableCell>
    </TableRow>
  );
}
