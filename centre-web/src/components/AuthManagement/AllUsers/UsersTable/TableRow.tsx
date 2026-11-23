import { CentreLink } from "@/components/Shared/CentreLink";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { CentreUserListItem } from "@/models/CentreUser";
import { TableRow } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";

type Props = {
  readonly user: CentreUserListItem;
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
      <CentreTableCell>
        {/* Clickable, but styled as plain text */}
        <CentreLink
          onClick={handleEditAccess}
          sx={{ color: "inherit", "&:hover": { textDecoration: "none" } }}
        >
          {`${user.last_name ?? ""}, ${user.first_name ?? ""}`}
        </CentreLink>
      </CentreTableCell>
      <CentreTableCell>
        <CentreLink onClick={handleEditAccess}>View/Edit Access</CentreLink>
      </CentreTableCell>
    </TableRow>
  );
}
