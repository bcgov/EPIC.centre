import React from "react";
import { LinearProgress, Stack, TableBody, TableRow } from "@mui/material";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { AccessRequest } from "@/models/AccessRequest";
import { CentreUser } from "@/models/CentreUser";
import { CentreLink } from "@/components/Shared/CentreLink";
import { getAppChipTitle } from "../../utils";
import { AppChip } from "@/components/Shared/AppChip";

type GroupedRequest = Partial<CentreUser> & {
  requests: AccessRequest[];
  user_auth_guid: string;
};
type TableBodyProps = {
  userRequests: Array<GroupedRequest>;
  isLoading: boolean;
  isError: boolean;
  rowsPerPage: number;
  searchText: string;
};

export const RequestsTableBody: React.FC<TableBodyProps> = ({
  userRequests,
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
            Error loading requests
          </CentreTableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (userRequests.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <CentreTableCell colSpan={3} align="center">
            {searchText
              ? `No requests found matching "${searchText}"`
              : "No requests found"}
          </CentreTableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {userRequests.map((user) => (
        <TableRow key={user.user_auth_guid}>
          <CentreTableCell>{`${user.last_name ?? ""}, ${user.first_name ?? ""}`}</CentreTableCell>
          <CentreTableCell sx={{ height: "35px" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {user.requests.map((request: any) => (
                <AppChip
                  key={request.id}
                  appName={getAppChipTitle(request.app.name)}
                />
              ))}
            </Stack>
          </CentreTableCell>
          <CentreTableCell>
            <CentreLink>View/Edit Access</CentreLink>
          </CentreTableCell>
        </TableRow>
      ))}

      {userRequests.length < rowsPerPage &&
        Array.from({ length: rowsPerPage - userRequests.length }).map(
          (_, idx) => (
            <TableRow key={`empty-row-${userRequests.length}-${idx}`}>
              <CentreTableCell
                colSpan={3}
                style={{
                  height: "35px",
                  border: "1px solid transparent",
                  marginBottom: 2,
                }}
              />
            </TableRow>
          ),
        )}
    </TableBody>
  );
};
