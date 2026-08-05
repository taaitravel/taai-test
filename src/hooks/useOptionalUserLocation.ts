import { useCallback, useState } from 'react';

export type UserLocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export interface UserLocationSnapshot {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
}

/** Location is requested only after an explicit user action and is not persisted. */
export const useOptionalUserLocation = () => {
  const [status, setStatus] = useState<UserLocationStatus>('idle');
  const [location, setLocation] = useState<UserLocationSnapshot | null>(null);

  const requestLocation = useCallback(async (): Promise<UserLocationSnapshot | null> => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return null;
    }
    setStatus('requesting');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const snapshot = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
            capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
          };
          setLocation(snapshot);
          setStatus('granted');
          resolve(snapshot);
        },
        (error) => {
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus('idle');
  }, []);

  return { status, location, requestLocation, clearLocation };
};
