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

  const isDisabled = user && !user.enabled;

  return (
    <TableContainer
      sx={
        isDisabled
          ? {
              color: "#898785",
              pointerEvents: "none",
            }
          : undefined
      }
    >
      <Table>
        <CentreTableHead>
          <TableRow>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "28%",
                  sm: "30%",
                  md: "20%",
                  lg: "25%",
                },
              }}
            >
              Application
            </CentreTableHeadCell>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "28%",
                  sm: "30%",
                  md: "20%",
                  lg: "25%",
                },
              }}
            >
              Current Access Level
            </CentreTableHeadCell>
            <CentreTableHeadCell
              sx={{
                width: {
                  xs: "22%",
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
                  xs: "22%",
                  sm: "20%",
                  md: "40%",
                  lg: "30%",
                },
              }}
            ></CentreTableHeadCell>
          </TableRow>
        </CentreTableHead>
        <TableBody>
          {apps.length > 0 ? (
            apps.map((app) => (
              <TableRow key={app.name}>
                <CentreTableCell>{getAppChipTitle(app.name)}</CentreTableCell>
                <CentreTableCell
                  sx={
                    isDisabled
                      ? {
                          color: "#898785",
                        }
                      : undefined
                  }
                >
                  {app.role ?? "--"}
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
                    onClick={() => handleAddEditAccess(app)}
                  >
                    Edit Access
                  </CentreLink>
                </CentreTableCell>
                <CentreTableCell
                  sx={
                    isDisabled
                      ? { color: "#898785", minHeight: "40px" }
                      : { minHeight: "40px" }
                  }
                >
                  <AppUserManagementButton
                    appUserManagementUrl={appUrlMap.get(app.name)}
                    supportsGranularRoleManagement={
                      app.supportsGranularRoleManagement ?? false
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
                colSpan={4}
                sx={
                  isDisabled
                    ? {
                        color: "#898785",
                      }
                    : undefined
                }
              >
                No Existing access.
              </CentreTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
