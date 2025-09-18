import { Box, Table, TableContainer, TablePagination } from "@mui/material";
import UsersTableHead from "./TableHead";
import React, { useState } from "react";
import { UsersTableBody } from "./TableBody";
import { CentreUser } from "@/models/CentreUser";

type UsersTableProps = {
  users: Array<CentreUser>;
  isLoading: boolean;
  isError: boolean;
};

export const UsersTable = ({ users, isLoading, isError }: UsersTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Paginate users client-side
  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <TableContainer>
        <Table>
          <UsersTableHead />
          <UsersTableBody
            users={paginatedUsers}
            isLoading={isLoading}
            isError={isError}
            rowsPerPage={rowsPerPage}
          />
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={users.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};
