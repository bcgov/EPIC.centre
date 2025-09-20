import { CentreLink } from "@/components/Shared/CentreLink";
import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";

export const CurrentAccessTable = () => {
  const mockRequests = [
    { application: "App A", access: "Read" },
    { application: "App B", access: "Write" },
    { application: "App C", access: "Admin" },
    { application: "App D", access: "Read" },
    { application: "App E", access: "Write" },
    { application: "App F", access: "Admin" },
    { application: "App G", access: "Read" },
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
              <CentreTableCell>
                <CentreLink>Edit Access</CentreLink>
              </CentreTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
