import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";

export const NewRequestsTable = () => {
  const mockRequests = [
    { application: "App A", access: "Read", actions: "Approve/Deny" },
  ];
  return (
    <TableContainer>
      <Table>
        <CentreTableHead>
          <TableRow>
            <CentreTableHeadCell>Application</CentreTableHeadCell>
            <CentreTableHeadCell>Access</CentreTableHeadCell>
            <CentreTableHeadCell>Actions</CentreTableHeadCell>
          </TableRow>
        </CentreTableHead>
        <TableBody>
          {mockRequests.map((request, index) => (
            <TableRow key={request.application + index}>
              <CentreTableCell>{request.application}</CentreTableCell>
              <CentreTableCell>{request.access}</CentreTableCell>
              <CentreTableCell>{request.actions}</CentreTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
