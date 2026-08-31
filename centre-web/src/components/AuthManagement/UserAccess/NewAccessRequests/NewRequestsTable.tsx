import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { CentreLink } from "@/components/Shared/CentreLink";
import { AccessRequest } from "@/models/AccessRequest";
import { CentreUser } from "@/models/CentreUser";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const formatRequestedDate = (isoDateString: string | null | undefined): string => {
  if (!isoDateString) return "";
  const date = dayjs.utc(isoDateString);
  if (!date.isValid()) return "";
  return date.local().format("YYYY-MM-DD");
};
import { getAppChipTitle } from "../../utils";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { EditAccessModal } from "../../EditAccess";
import { useAppConfigs } from "@/hooks/api/useAppConfigs";
import { useMemo } from "react";
import { AppUserManagementButton } from "../AppUserManagementButton";
import { useParams } from "@tanstack/react-router";

export const NewRequestsTable = ({
  requests,
  user,
}: {
  requests: AccessRequest[];
  user?: CentreUser;
}) => {
  const { username } = useParams({
    strict: false,
  });
  const { setOpen: setModalOpen } = useModal();
  const { data: appConfigs = [] } = useAppConfigs();

  const appUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    appConfigs.forEach((config) => {
      if (config.app_user_management_url) {
        map.set(config.name, config.app_user_management_url);
      }
    });
    return map;
  }, [appConfigs]);

  const appSupportsGranularRoleManagementMap = useMemo(() => {
    const map = new Map<string, boolean>();
    appConfigs.forEach((config) => {
      map.set(config.name, !!config.app_user_management_url);
    });
    return map;
  }, [appConfigs]);

  const handleEditAccess = (request: AccessRequest) => {
    if (!user) return;

    const app = {
      name: request.app.name,
      role: null, // New requests don't have current access level
      group_name: null,
      group_path: null,
      supportsGranularRoleManagement:
        appSupportsGranularRoleManagementMap.get(request.app.name) ?? false,
    };

    const modalWithFocusReturn = (
      <EditAccessModal
        user={user}
        app={app}
        username={String(username)}
        request={request}
      />
    );

    setModalOpen(modalWithFocusReturn);
  };

  const isDisabled = user && !user.enabled;

  return (
    <TableContainer
      sx={
        isDisabled
          ? {
              pointerEvents: "none",
            }
          : undefined
      }
    >
      <Table sx={{ tableLayout: "fixed" }}>
        <CentreTableHead>
          <TableRow>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "20%",
                  sm: "20%",
                  md: "20%",
                  lg: "20%",
                },
              }}
            >
              Application
            </CentreTableHeadCell>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "20%",
                  sm: "20%",
                  md: "20%",
                  lg: "20%",
                },
              }}
            >
              Requested Date
            </CentreTableHeadCell>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "20%",
                  sm: "20%",
                  md: "20%",
                  lg: "20%",
                },
              }}
            >
              Current Access Level
            </CentreTableHeadCell>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "20%",
                  sm: "20%",
                  md: "20%",
                  lg: "20%",
                },
              }}
            >
              Actions
            </CentreTableHeadCell>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "20%",
                  sm: "20%",
                  md: "20%",
                  lg: "20%",
                },
              }}
            ></CentreTableHeadCell>
          </TableRow>
        </CentreTableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.id}>
                <CentreTableCell>
                  {getAppChipTitle(request.app.name)}
                </CentreTableCell>
                <CentreTableCell>
                  {formatRequestedDate(request.created_date)}
                </CentreTableCell>
                <CentreTableCell
                  sx={
                    isDisabled
                      ? { color: "#898785" }
                      : undefined
                  }
                >
                  --
                </CentreTableCell>
                <CentreTableCell
                  sx={
                    isDisabled
                      ? { color: "#898785" }
                      : undefined
                  }
                >
                  <CentreLink
                    disabled={isDisabled}
                    onClick={() => handleEditAccess(request)}
                  >
                    Edit Access
                  </CentreLink>
                </CentreTableCell>
                <CentreTableCell
                  align="right"
                  sx={
                    isDisabled
                      ? { color: "#898785", minHeight: "40px" }
                      : { minHeight: "40px" }
                  }
                >
                  <AppUserManagementButton
                    appUserManagementUrl={appUrlMap.get(request.app.name)}
                    supportsGranularRoleManagement={
                      appSupportsGranularRoleManagementMap.get(
                        request.app.name,
                      ) ?? false
                    }
                    disabled={isDisabled}
                  />
                </CentreTableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <CentreTableCell
                align="center"
                colSpan={5}
                sx={
                  isDisabled
                    ? { color: "#898785" }
                    : undefined
                }
              >
                No pending access requests.
              </CentreTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
