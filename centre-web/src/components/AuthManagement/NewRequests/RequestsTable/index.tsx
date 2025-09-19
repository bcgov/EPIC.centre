import { Box, Table, TableContainer, TablePagination } from "@mui/material";
import React, { useState } from "react";
import { AccessRequest } from "@/models/AccessRequest";
import RequestsTableHead from "./TableHead";
import { RequestsTableBody } from "./TableBody";
import { groupRequestsByUser } from "./utils";

type RequestsTableProps = {
  requests: Array<AccessRequest>;
  isLoading: boolean;
  isError: boolean;
  searchText: string;
};
export const RequestsTable = ({
  requests,
  isLoading,
  isError,
  searchText,
}: RequestsTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const groupedRequests = React.useMemo(
    () => groupRequestsByUser(requests),
    [requests],
  );

  // Paginate requests client-side
  const paginatedUserRequests = groupedRequests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 5));
    setPage(0);
  };

  return (
    <Box>
      <TableContainer>
        <Table>
          <RequestsTableHead />
          <RequestsTableBody
            userRequests={paginatedUserRequests}
            isLoading={isLoading}
            isError={isError}
            searchText={searchText}
            rowsPerPage={rowsPerPage}
          />
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={groupedRequests.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};
