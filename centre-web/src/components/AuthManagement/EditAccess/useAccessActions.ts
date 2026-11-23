import { useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useRevokeUserAccess, useUpdateUserGroup } from "@/hooks/api/useUsers";
import {
  useUpdateAccessRequest,
  useUserAccessRequests,
} from "@/hooks/api/useAccessRequests";
import { AccessRequestStatus } from "@/models/AccessRequest";
import { EPIC_APP_TO_GROUP } from "@/models/KCGroup";
import { ACTION_TYPES } from "./constants";
import { getErrorMessage } from "@/utils/errorUtils";

type AccessLevel = {
  name: string;
  group_path: string;
  group_name: string;
};

type UseAccessActionsProps = {
  username: string;
  appName: string;
  userId: string;
  onClose: () => void;
};

export const useAccessActions = ({
  username,
  appName,
  userId,
  onClose,
}: UseAccessActionsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // executeAction reports failures
  const { mutateAsync: updateUserGroup } = useUpdateUserGroup();
  const { mutateAsync: revokeUserAccess } = useRevokeUserAccess();
  const { mutateAsync: updateAccessRequest } = useUpdateAccessRequest();

  const { refetch: refetchAccessRequests } = useUserAccessRequests({
    user_auth_guid: userId,
    status: AccessRequestStatus.PENDING,
    enabled: !!userId,
  });

  const handleRevokeAccess = async () => {
    await revokeUserAccess({
      username,
      appName,
    });
  };

  const handleDenyRequest = async (requestId: string | number) => {
    await updateAccessRequest({
      access_request_id: String(requestId),
      status: AccessRequestStatus.REJECTED,
    });
    await refetchAccessRequests();
  };

  const handleUpdateAccess = async (
    accessLevel: AccessLevel,
    requestId?: string | number,
  ) => {
    const parentGroupName =
      EPIC_APP_TO_GROUP[appName as keyof typeof EPIC_APP_TO_GROUP];

    if (!parentGroupName) {
      throw new Error("Invalid application name.");
    }

    await updateUserGroup({
      username,
      groupName: accessLevel.group_name,
      appName,
      parentGroupName,
      accessRequestId: requestId ? Number(requestId) : undefined,
    });
    await refetchAccessRequests();
  };

  const executeAction = async (
    selectedRole: string | null,
    accessLevels: AccessLevel[],
    requestId?: string | number,
  ) => {
    if (!selectedRole) {
      notify.error("Please select an access level.");
      return false;
    }

    const isDeny = selectedRole === ACTION_TYPES.DENY;
    const isRevoke = selectedRole === ACTION_TYPES.REVOKE;

    setIsUpdating(true);

    try {
      if (isRevoke) {
        await handleRevokeAccess();
      } else if (isDeny) {
        if (!requestId) {
          notify.error("No access request found to deny.");
          return false;
        }
        await handleDenyRequest(requestId);
      } else {
        const selectedAccessLevel = accessLevels.find(
          (level) => level.group_path === selectedRole,
        );

        if (!selectedAccessLevel) {
          notify.error("Please select a valid access level.");
          return false;
        }

        await handleUpdateAccess(selectedAccessLevel, requestId);
      }

      notify.success("User access updated successfully.");
      onClose();
      return true;
    } catch (error) {
      notify.error(
        getErrorMessage(error, "Unable to update user access. Please try again."),
      );
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    executeAction,
  };
};
