export type EpicAppName =
  | 'epic_submit'
  | 'condition_repository'
  | 'epic_compliance'
  | 'epic_engage'
  | 'epic_public';

export interface EaoAnalyticsOptions {
  appName: EpicAppName;
  centreApiUrl: string;
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UserInfo {
  user_auth_guid: string;
}

export interface EaoAnalyticsPayload {
  user_auth_guid: string;
  app_name: EpicAppName;
}

