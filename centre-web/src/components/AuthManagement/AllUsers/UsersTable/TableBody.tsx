import React from "react";
import UsersTableRow from "./TableRow";
import { LinearProgress, Stack, TableBody, TableRow } from "@mui/material";
import { CentreTableCell } from "@/components/Shared/CentreTable";

type TableBodyProps = {
  users: Array<any>;
  isLoading: boolean;
  isError: boolean;
  rowsPerPage: number;
};

export const UsersTableBody: React.FC<TableBodyProps> = ({
  users,
  isLoading,
  isError,
  rowsPerPage,
}) => {
  if (isLoading) {
    return (
      <TableRow>
        <CentreTableCell colSpan={3}>
          <Stack direction="column" alignItems="center">
            Loading...
            <LinearProgress sx={{ width: "100%" }} />
          </Stack>
        </CentreTableCell>
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

      {users.length < rowsPerPage &&
        Array.from({ length: rowsPerPage - users.length }).map((_, idx) => (
          <TableRow key={`empty-row-${users.length}-${idx}`}>
            <CentreTableCell
              colSpan={3}
              style={{
                height: "35px",
                border: "1px solid transparent",
                marginBottom: 2,
              }}
            />
          </TableRow>
        ))}
    </TableBody>
  );
};
