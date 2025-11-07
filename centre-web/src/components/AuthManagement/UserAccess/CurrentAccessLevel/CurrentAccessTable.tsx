import { CentreLink } from "@/components/Shared/CentreLink";
import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { CentreUser, CentreUserApp } from "@/models/CentreUser";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";
import { getAppChipTitle } from "../../utils";
import { useMemo, useRef } from "react";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { EditAccessModal } from "../../EditAccess";
import { useAppConfigs } from "@/hooks/api/useAppConfigs";
import { AppUserManagementButton } from "../AppUserManagementButton";
import { useParams } from "@tanstack/react-router";
import { useUserAccessRequests } from "@/hooks/api/useAccessRequests";

type CurrentAccessTableProps = {
  user?: CentreUser;
};
export const CurrentAccessTable = ({ user }: CurrentAccessTableProps) => {
  const { username } = useParams({
    strict: false,
  });
  const { setOpen: setModalOpen } = useModal();
  const { data: appConfigs = [] } = useAppConfigs();

  const { data: requests = [] } = useUserAccessRequests({
    user_auth_guid: user?.id || "",
    enabled: !!user?.id,
  });

  const editButtonRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

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

  const handleAddEditAccess = (app: CentreUserApp) => {
    if (!user) return;

    const request = requests.find((req) => req.app.name === app.name);

    const modalWithFocusReturn = (
      <EditAccessModal
        user={user}
        app={app}
        onClose={() => {
          const buttonRef = editButtonRefs.current.get(app.name);
          if (buttonRef) {
            setTimeout(() => buttonRef.focus(), 100);
          }
        }}
        username={String(username)}
        request={request}
      />
    );

    setModalOpen(modalWithFocusReturn);
  };

  const apps = useMemo(() => {
    const userApps = user?.apps || [];

    return userApps.map((app) => ({
      ...app,
      supportsGranularRoleManagement:
        appSupportsGranularRoleManagementMap.get(app.name) ?? false,
    }));
  }, [user, appSupportsGranularRoleManagementMap]);

  const appUserManagementTabIndex = useMemo(() => {
    let currentTabIndex = apps.length + 1;
    const tabIndexMap = new Map<number, number>();

    apps.forEach((app, index) => {
      if (app.supportsGranularRoleManagement && appUrlMap.get(app.name)) {
        tabIndexMap.set(index, currentTabIndex);
        currentTabIndex++;
      }
    });

    return tabIndexMap;
  }, [apps, appUrlMap]);

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
          {apps.length > 0 ? (
            apps.map((app, index) => (
              <TableRow key={app.name}>
                <CentreTableCell>{getAppChipTitle(app.name)}</CentreTableCell>
                <CentreTableCell>{app.role ?? "--"}</CentreTableCell>
                <CentreTableCell>
                  <CentreLink
                    onClick={() => handleAddEditAccess(app)}
                    tabIndex={index + 1}
                    ref={(el) => {
                      if (el) {
                        editButtonRefs.current.set(app.name, el);
                      } else {
                        editButtonRefs.current.delete(app.name);
                      }
                    }}
                  >
                    Edit Access
                  </CentreLink>
                </CentreTableCell>
                <CentreTableCell sx={{ minHeight: "40px" }}>
                  <AppUserManagementButton
                    appUserManagementUrl={appUrlMap.get(app.name)}
                    supportsGranularRoleManagement={
                      app.supportsGranularRoleManagement ?? false
                    }
                    tabIndex={appUserManagementTabIndex.get(index) || -1}
                  />
                </CentreTableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <CentreTableCell align="center" colSpan={4}>
                No Existing access.
              </CentreTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
