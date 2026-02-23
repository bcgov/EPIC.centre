import { centreRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";

export const EPIC_CENTRE_APP_NAME = "epic_centre";

type RecordLoginParams = {
  user_auth_guid: string;
  app_name: string;
};

const recordLogin = ({ user_auth_guid, app_name }: RecordLoginParams) => {
  return centreRequest({
    url: "eao-analytics",
    method: "POST",
    data: { user_auth_guid, app_name },
  });
};

export const useRecordLogin = () => {
  return useMutation({
    mutationFn: recordLogin,
  });
};
