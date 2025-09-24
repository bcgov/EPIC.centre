import { CentreLink } from "@/components/Shared/CentreLink";
import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { CentreUser } from "@/models/CentreUser";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";
import { getAppChipTitle } from "../../utils";
import { useMemo } from "react";
import { getAllAppsWithRoles } from "./utils";

type CurrentAccessTableProps = {
  user?: CentreUser;
};
export const CurrentAccessTable = ({ user }: CurrentAccessTableProps) => {
  const userApps = user?.apps || [];

  const apps = useMemo(() => getAllAppsWithRoles(userApps), [userApps]);

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
          {apps.length > 0 ? (
            apps.map((app) => (
              <TableRow key={app.name}>
                <CentreTableCell>{getAppChipTitle(app.name)}</CentreTableCell>
                <CentreTableCell>{app.role ?? "--"}</CentreTableCell>
                <CentreTableCell>
                  <CentreLink>Edit Access</CentreLink>
                </CentreTableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <CentreTableCell align="center" colSpan={3}>
                No Existing access.
              </CentreTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
