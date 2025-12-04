import { useEffect, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { extractUserInfo } from './utils/tokenExtractor';
import { trackLogin } from './utils/apiClient';
import { EaoAnalyticsOptions } from './types';

const ANALYTICS_DEBOUNCE_MS = 5000; // 5 seconds
const SESSION_STORAGE_KEY = 'epic_eao_analytics_last_recorded';

interface AnalyticsState {
  lastRecorded: number;
  appName: string;
}

/**
 * React hook to record user login analytics across EPIC applications
 * Automatically records login analytics when user is authenticated
 */
export function useEaoAnalytics(options: EaoAnalyticsOptions) {
  const { appName, centreApiUrl, enabled = true, onSuccess, onError } = options;
  const { user, isAuthenticated } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const recordingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !user) {
      return;
    }

    if (recordingRef.current) {
      return;
    }

      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const state: AnalyticsState = JSON.parse(stored);
        const timeSinceLastRecord = Date.now() - state.lastRecorded;
        
        // If same app and recorded recently, skip
        if (state.appName === appName && timeSinceLastRecord < ANALYTICS_DEBOUNCE_MS) {
          return;
        }
      }

    // Extract user info from token
    const userInfo = extractUserInfo(user);
    if (!userInfo) {
      console.warn('EAO Analytics: Could not extract user info from token');
      return;
    }

    // Get access token
    const accessToken = user.access_token;
    if (!accessToken) {
      console.warn('EAO Analytics: No access token available');
      return;
    }

    // Record analytics
    const performAnalytics = async () => {
      recordingRef.current = true;
      setIsRecording(true);
      setError(null);

      try {
        await trackLogin(centreApiUrl, accessToken, {
          user_auth_guid: userInfo.user_auth_guid,
          app_name: appName,
        });

        // Store analytics state in sessionStorage
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              lastRecorded: Date.now(),
              appName,
            } as AnalyticsState)
          );


        onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      } finally {
        setIsRecording(false);
        recordingRef.current = false;
      }
    };

    performAnalytics();
  }, [isAuthenticated, user, appName, centreApiUrl, enabled, onSuccess, onError]);

  return {
    isRecording,
    error,
  };
}

