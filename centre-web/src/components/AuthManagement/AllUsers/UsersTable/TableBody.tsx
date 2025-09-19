import React from "react";
import UsersTableRow from "./TableRow";
import { LinearProgress, Stack, TableBody, TableRow } from "@mui/material";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { CentreUser } from "@/models/CentreUser";

type TableBodyProps = {
  users: Array<CentreUser>;
  isLoading: boolean;
  isError: boolean;
  rowsPerPage: number;
  searchText: string;
};

export const UsersTableBody: React.FC<TableBodyProps> = ({
  users,
  isLoading,
  isError,
  rowsPerPage,
  searchText,
}) => {
  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <CentreTableCell colSpan={3}>
            <Stack direction="column" alignItems="center">
              Loading...
              <LinearProgress sx={{ width: "100%" }} />
            </Stack>
          </CentreTableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (isError) {
    return (
      <TableBody>
        <TableRow>
          <CentreTableCell colSpan={3} align="center">
            Error loading users
          </CentreTableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (users.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <CentreTableCell colSpan={3} align="center">
            {searchText
              ? `No users found matching "${searchText}"`
              : "No users found"}
          </CentreTableCell>
        </TableRow>
      </TableBody>
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
