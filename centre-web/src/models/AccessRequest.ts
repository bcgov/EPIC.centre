import { CentreUser } from "./CentreUser";

export enum AccessRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}
export type AccessRequest = {
  id: number;
  app_id: number;
  user_auth_guid: string;
  status: AccessRequestStatus;
  created_date: string | null;
  updated_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  user: Partial<CentreUser>;
};

export type GroupedRequestsType = {
  user_auth_guid: string;
  first_name: string;
  last_name: string;
  email: string;
  apps: string[];
  requests: AccessRequest[];
};
