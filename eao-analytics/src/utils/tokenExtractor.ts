import { User } from 'oidc-client-ts';
import { UserInfo } from '../types';

/**
 * Extract user_auth_guid from OIDC user object
 * Uses preferred_username as user_auth_guid
 */
export function extractUserInfo(user: User | null): UserInfo | null {
  if (!user || !user.profile) {
    return null;
  }

  const profile = user.profile;

  const user_auth_guid = profile.preferred_username || profile.sub;
  
  if (!user_auth_guid) {
    return null;
  }

  return {
    user_auth_guid,
  };
}

