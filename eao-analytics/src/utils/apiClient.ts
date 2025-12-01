import axios, { AxiosError } from 'axios';
import { EaoAnalyticsPayload } from '../types';

/**
 * Record user login analytics by calling EPIC.centre API
 * @param apiUrl - Base URL of EPIC.centre API
 * @param accessToken - User's access token for authentication
 * @param payload - EAO Analytics payload
 */
export async function trackLogin(
  apiUrl: string,
  accessToken: string,
  payload: EaoAnalyticsPayload
): Promise<void> {
  if (!apiUrl) {
    throw new Error('EPIC.centre API URL is required');
  }

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  // Ensure API URL doesn't end with slash
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const endpoint = `${baseUrl}/api/eao-analytics`;

  try {
    await axios.post(
      endpoint,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // Server responded with error status
        throw new Error(
          `EAO Analytics recording failed: ${axiosError.response.status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        // Request made but no response
        throw new Error('EAO Analytics recording failed: No response from server');
      }
    }
    // Re-throw if it's already an Error, otherwise wrap it
    throw error instanceof Error ? error : new Error('EAO Analytics recording failed: Unknown error');
  }
}

