import { AccessRequest } from "@/models/AccessRequest";

export const groupRequestsByUser = (
  requests: AccessRequest[],
): Array<
  AccessRequest["user"] & {
    requests: AccessRequest[];
    user_auth_guid: string;
  }
> => {
  return Object.values(
    requests.reduce<
      Record<
        string,
        AccessRequest["user"] & {
          requests: AccessRequest[];
          user_auth_guid: string;
        }
      >
    >((acc, req) => {
      const key = req.user_auth_guid;
      if (!acc[key]) {
        acc[key] = {
          user_auth_guid: req.user_auth_guid,
          ...req.user,
          requests: [],
        };
      }
      acc[key].requests.push(req);
      return acc;
    }, {}),
  );
};
