import React from "react";
import UsersTableRow from "./TableRow";
import { TableBody, TableRow } from "@mui/material";
import { CentreTableCell } from "@/components/Shared/CentreTable";

interface TableBodyProps {
  users: Array<any>;
  isLoading: boolean;
  isError: boolean;
}

export const UsersTableBody: React.FC<TableBodyProps> = ({
  users,
  isLoading,
  isError,
}) => {
  if (isLoading) {
    return (
      <TableRow>
        <CentreTableCell colSpan={3}>Loading...</CentreTableCell>
      </TableRow>
    );
  }

  if (isError) {
    return (
      <TableRow>
        <CentreTableCell colSpan={3}>Error loading users</CentreTableCell>
      </TableRow>
    );
  }

  return (
    <TableBody>
      {users.map((user) => (
        <UsersTableRow key={user.id} user={user} />
      ))}
    </TableBody>
  );
};
