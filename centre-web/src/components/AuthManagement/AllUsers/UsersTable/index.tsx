import { Box, Table, TableContainer, TablePagination } from "@mui/material";
import UsersTableHead from "./TableHead";
import React, { useMemo, useState } from "react";
import { UsersTableBody } from "./TableBody";
import { CentreUser } from "@/models/CentreUser";

import type { SortField, SortOrder } from "./TableHead";

function getSortValue(user: CentreUser, orderBy: SortField): string {
  return orderBy === "name"
    ? `${user.last_name ?? ""}, ${user.first_name ?? ""}`.toLowerCase()
    : user.username ?? "";
}

function descendingComparator(
  a: CentreUser,
  b: CentreUser,
  orderBy: SortField,
): number {
  const aVal = getSortValue(a, orderBy);
  const bVal = getSortValue(b, orderBy);
  return bVal.localeCompare(aVal);
}

function getComparator(
  order: SortOrder,
  orderBy: SortField,
): (a: CentreUser, b: CentreUser) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

type UsersTableProps = {
  users: Array<CentreUser>;
  isLoading: boolean;
  isError: boolean;
  searchText: string;
};

export const UsersTable = ({
  users,
  isLoading,
  isError,
  searchText,
}: UsersTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<SortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");

  const handleRequestSort = (_event: React.MouseEvent<unknown>, field: SortField) => {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
    setPage(0);
  };

  const sortedUsers = useMemo(
    () => [...users].sort(getComparator(order, orderBy)),
    [users, orderBy, order],
  );

  // Paginate users client-side
  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <TableContainer>
        <Table>
          <UsersTableHead
            orderBy={orderBy}
            order={order}
            onRequestSort={handleRequestSort}
          />
          <UsersTableBody
            users={paginatedUsers}
            isLoading={isLoading}
            isError={isError}
            rowsPerPage={rowsPerPage}
            searchText={searchText}
          />
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={sortedUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};
