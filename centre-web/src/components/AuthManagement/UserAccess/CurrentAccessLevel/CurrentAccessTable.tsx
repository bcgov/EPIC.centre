import { CentreLink } from "@/components/Shared/CentreLink";
import {
  CentreTableCell,
  CentreTableHead,
  CentreTableHeadCell,
} from "@/components/Shared/CentreTable";
import { CentreUser, CentreUserApp } from "@/models/CentreUser";
import { Table, TableBody, TableContainer, TableRow } from "@mui/material";
import { getAppChipTitle } from "../../utils";
import { useMemo } from "react";
import { getAllAppsWithRoles } from "./utils";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { EditAccessModal } from "../../EditAccess";
import { useAppConfigs } from "@/hooks/api/useAppConfigs";
import { useRef } from "react";
import { AppUserManagementButton } from "../AppUserManagementButton";

type CurrentAccessTableProps = {
  user?: CentreUser;
};
export const CurrentAccessTable = ({ user }: CurrentAccessTableProps) => {
  const { setOpen: setModalOpen } = useModal();
  const { data: appConfigs = [] } = useAppConfigs();
  
  const editButtonRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  
  const appUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    appConfigs.forEach(config => {
      if (config.app_user_management_url) {
        map.set(config.name, config.app_user_management_url);
      }
    });
    return map;
  }, [appConfigs]);
  
  const appSupportsGranularRoleManagementMap = useMemo(() => {
    const map = new Map<string, boolean>();
    appConfigs.forEach(config => {
      map.set(config.name, !!(config.app_user_management_url));
    });
    return map;
  }, [appConfigs]);
  
  const handleAddEditBookmarks = (app: CentreUserApp) => {
    if (!user) return;
    
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
      />
    );
    
    setModalOpen(modalWithFocusReturn);
  };

  const apps = useMemo(() => {
    const userApps = user?.apps || [];
    const appsWithRoles = getAllAppsWithRoles(userApps);
    
    return appsWithRoles.map(app => ({
      ...app,
      supportsGranularRoleManagement: appSupportsGranularRoleManagementMap.get(app.name) ?? false,
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
            <CentreTableHeadCell sx={{ width: "30%" }}>
              Application
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "30%" }}>
              Current Access Level
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "30%" }}>
            </CentreTableHeadCell>
            <CentreTableHeadCell sx={{ width: "10%" }}>
              Actions
            </CentreTableHeadCell>
          </TableRow>
        </CentreTableHead>
        <TableBody>
          {apps.length > 0 ? (
            apps.map((app, index) => (
              <TableRow key={app.name}>
                <CentreTableCell>{getAppChipTitle(app.name)}</CentreTableCell>
                <CentreTableCell>{app.role ?? "--"}</CentreTableCell>
                <CentreTableCell sx={{ minHeight: "40px" }}>
                  <AppUserManagementButton
                    appUserManagementUrl={appUrlMap.get(app.name)}
                    supportsGranularRoleManagement={app.supportsGranularRoleManagement ?? false}
                    tabIndex={appUserManagementTabIndex.get(index) || -1}
                  />
                </CentreTableCell>
                <CentreTableCell>
                  <CentreLink 
                    onClick={() => handleAddEditBookmarks(app)}
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
