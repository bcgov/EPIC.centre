export type KcUser = {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  attributes?: Record<string, string[]>;
  enabled?: boolean;
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
  applicationRoles?: Record<string, string[]>;
  groups?: string[];
};
