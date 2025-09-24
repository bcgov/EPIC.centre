import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { AccessRequest } from "@/models/AccessRequest";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";
import { getAppChipTitle } from "../../utils";

export const NewRequestsTable = ({
  requests,
}: {
  requests: AccessRequest[];
}) => {
  return (
    <TableContainer>
      <Table>
        <CentreTableHead>
          <TableRow>
            <CentreTableHeadCell sx={{ width: "30%" }}>
              Application
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "30%" }}>
              Current Access Level
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "40%" }}>
              Actions
            </CentreTableHeadCell>
          </TableRow>
        </CentreTableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.id}>
                <CentreTableCell>
                  {getAppChipTitle(request.app.name)}
                </CentreTableCell>
                <CentreTableCell></CentreTableCell>
                <CentreTableCell></CentreTableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <CentreTableCell align="center" colSpan={3}>
                No pending access requests.
              </CentreTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
