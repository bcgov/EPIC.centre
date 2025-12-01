import { User } from 'oidc-client-ts';
import { UserInfo } from '../types';

/**
 * Extract user_auth_guid from OIDC user object
 * Uses preferred_username as user_auth_guid, falls back to sub if preferred_username not available
 */
export function extractUserInfo(user: User | null): UserInfo | null {
  if (!user || !user.profile) {
    return null;
  }

  const profile = user.profile;

  // Use preferred_username as user_auth_guid, fallback to sub if preferred_username not available
  const user_auth_guid = profile.preferred_username || profile.sub;
  
  if (!user_auth_guid) {
    return null;
  }

  return {
    user_auth_guid,
  };
}

