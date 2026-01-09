import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  timestamp: string;
}

export interface LocationContextType {
  locationData: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  isLocationEnabled: boolean;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  setLocationEnabled: (enabled: boolean) => void;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);

// Cache keys
const LOCATION_CACHE_KEY = 'epic_search_user_location';
const LOCATION_ENABLED_KEY = 'epic_search_location_enabled';
// const LOCATION_PERMISSION_KEY = 'epic_search_location_permission';

// Cache duration: 30 minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLocationEnabled, setIsLocationEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LOCATION_ENABLED_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  // Load cached location on mount
  useEffect(() => {
    loadCachedLocation();
    checkExistingPermission();
  }, []);

  const loadCachedLocation = useCallback(() => {
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const locationData: LocationData = JSON.parse(cached);
        const age = Date.now() - new Date(locationData.timestamp).getTime();
        
        if (age < CACHE_DURATION_MS) {
          setLocationData(locationData);
          return;
        } else {
          // Clear stale cache
          localStorage.removeItem(LOCATION_CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached location:', error);
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
  }, []);

  const checkExistingPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setHasPermission(false);
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setHasPermission(result.state === 'granted');
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        setHasPermission(result.state === 'granted');
        if (result.state === 'denied') {
          clearLocation();
          setLocationEnabled(false);
        }
      });
    } catch (error) {
      console.warn('Permission API not supported:', error);
    }
  }, []);

  const setLocationEnabled = useCallback((enabled: boolean) => {
    setIsLocationEnabledState(enabled);
    try {
      localStorage.setItem(LOCATION_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save location preference:', error);
    }

    if (!enabled) {
      clearLocation();
    } else if (hasPermission) {
      requestLocation();
    }
  }, [hasPermission]);

  const clearLocation = useCallback(() => {
    setLocationData(null);
    setError(null);
    try {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear location cache:', error);
    }
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<Partial<LocationData>> => {
    try {
      // Using OpenStreetMap's Nominatim service for reverse geocoding
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=10`,
        {
          headers: {
            'User-Agent': 'EPIC.Search/1.0'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        
        return {
          city: address.city || address.town || address.village || address.municipality,
          region: address.state || address.province || address.region,
          country: address.country
        };
      }
    } catch (error) {
      // Reverse geocoding is optional - don't log errors unless they're unexpected
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Reverse geocoding failed:', error.message);
      }
    }
    
    return {};
  };

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setHasPermission(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Try to get city/region information
      const geocodeData = await reverseGeocode(latitude, longitude);
      
      const newLocationData: LocationData = {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        ...geocodeData
      };

      setLocationData(newLocationData);
      setHasPermission(true);
      setError(null);

      // Cache the location
      try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newLocationData));
      } catch (error) {
        console.warn('Failed to cache location:', error);
      }

    } catch (error: any) {
      let errorMessage = 'Failed to get location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          setHasPermission(false);
          setLocationEnabled(false);
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
        default:
          errorMessage = error.message || 'Unknown location error';
      }
      
      setError(errorMessage);
      console.warn('Geolocation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-request location if enabled and permission granted but no data
  useEffect(() => {
    if (isLocationEnabled && hasPermission === true && !locationData && !isLoading && !error) {
      requestLocation();
    }
  }, [isLocationEnabled, hasPermission, locationData, isLoading, error, requestLocation]);

  const refreshLocation = useCallback(async () => {
    if (isLocationEnabled && (hasPermission || hasPermission === null)) {
      clearLocation();
      await requestLocation();
    }
  }, [isLocationEnabled, hasPermission, requestLocation, clearLocation]);

  const contextValue: LocationContextType = {
    locationData,
    isLoading,
    error,
    hasPermission,
    isLocationEnabled,
    requestLocation,
    clearLocation,
    setLocationEnabled,
    refreshLocation
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationProvider;