import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { CentreLink } from "@/components/Shared/CentreLink";
import { AccessRequest } from "@/models/AccessRequest";
import { CentreUser } from "@/models/CentreUser";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";
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
  return (
    <TableContainer>
      <Table>
        <CentreTableHead>
          <TableRow>
            <CentreTableHeadCell sx={{ width: "35%" }}>
              Application
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "35%" }}>
              Current Access Level
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "10%" }}>
              Actions
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "20%" }}></CentreTableHeadCell>
          </TableRow>
        </CentreTableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.id}>
                <CentreTableCell>
                  {getAppChipTitle(request.app.name)}
                </CentreTableCell>
                <CentreTableCell>--</CentreTableCell>
                <CentreTableCell>
                  <CentreLink onClick={() => handleEditAccess(request)}>
                    Edit Access
                  </CentreLink>
                </CentreTableCell>
                <CentreTableCell sx={{ minHeight: "40px" }}>
                  <AppUserManagementButton
                    appUserManagementUrl={appUrlMap.get(request.app.name)}
                    supportsGranularRoleManagement={
                      appSupportsGranularRoleManagementMap.get(
                        request.app.name,
                      ) ?? false
                    }
                  />
                </CentreTableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <CentreTableCell align="center" colSpan={4}>
                No pending access requests.
              </CentreTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
