import React from "react";
import { LinearProgress, Stack, TableBody, TableRow } from "@mui/material";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { AccessRequest } from "@/models/AccessRequest";
import { CentreUser } from "@/models/CentreUser";
import { CentreLink } from "@/components/Shared/CentreLink";
import { getAppChipTitle } from "../../utils";
import { AppChip } from "@/components/Shared/AppChip";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const formatRequestedDate = (isoDateString: string | null | undefined): string => {
  if (!isoDateString) return "";
  const date = dayjs.utc(isoDateString);
  if (!date.isValid()) return "";
  return date.local().format("YYYY-MM-DD");
};

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
  const navigate = useNavigate();

  const handleEditAccess = (user: GroupedRequest) => {
    navigate({
      to: "/request-access/auth/users/$username",
      params: { username: user.username ?? "" },
    });
  };

  const getEarliestRequestedDate = (requests: AccessRequest[]) => {
    const dates = requests
      .map((r) => r.created_date)
      .filter((d): d is string => d != null);
    if (dates.length === 0) return "";
    const earliest = [...dates].sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime(),
    )[0];
    return formatRequestedDate(earliest);
  };

  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <CentreTableCell colSpan={4}>
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
          <CentreTableCell colSpan={4} align="center">
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
          <CentreTableCell colSpan={4} align="center">
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
          <CentreTableCell>
            {getEarliestRequestedDate(user.requests)}
          </CentreTableCell>
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
            <CentreLink onClick={() => handleEditAccess(user)}>
              View/Edit Access
            </CentreLink>
          </CentreTableCell>
        </TableRow>
      ))}

      {userRequests.length < rowsPerPage &&
        Array.from({ length: rowsPerPage - userRequests.length }).map(
          (_, idx) => (
            <TableRow key={`empty-row-${userRequests.length}-${idx}`}>
              <CentreTableCell
                colSpan={4}
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
