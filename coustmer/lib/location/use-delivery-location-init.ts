import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

import {
  isBadStoredLocation,
  resolvePlaceFromCoords,
} from '@/lib/location/resolve-place';
import { useAuthStore } from '@/store/auth-store';
import { useDeliveryLocationStore } from '@/store/delivery-location-store';

/** Auto-detect GPS on first launch, and repair bad Lat/Lng saved locations. */
export function useDeliveryLocationInit() {
  const authHydrated = useAuthStore((s) => s.isHydrated);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const hasHydrated = useDeliveryLocationStore((s) => s.hasHydrated);
  const location = useDeliveryLocationStore((s) => s.location);
  const isDetecting = useDeliveryLocationStore((s) => s.isDetecting);
  const setLocation = useDeliveryLocationStore((s) => s.setLocation);
  const setDetecting = useDeliveryLocationStore((s) => s.setDetecting);
  const started = useRef(false);
  const repaired = useRef(false);

  // Allow GPS / repair to run again after logout or account switch.
  useEffect(() => {
    started.current = false;
    repaired.current = false;
  }, [userId]);

  // Repair previously saved "Lat / Lng …" junk so UI shows a real place name
  useEffect(() => {
    if (!hasHydrated || !authHydrated || !location || repaired.current || isDetecting) {
      return;
    }
    if (!isBadStoredLocation(location)) return;
    repaired.current = true;

    void (async () => {
      setDetecting(true);
      try {
        const resolved = await resolvePlaceFromCoords({
          lat: location.lat,
          lng: location.lng,
          source: location.source,
        });
        setLocation({
          ...resolved,
          source: location.source,
          updatedAt: Date.now(),
        });
      } catch {
        // keep existing; user can re-pick
      } finally {
        setDetecting(false);
      }
    })();
  }, [hasHydrated, authHydrated, location, isDetecting, setDetecting, setLocation]);

  useEffect(() => {
    // Wait for auth so a returning user's saved pin can bind before GPS runs.
    if (!hasHydrated || !authHydrated || location || isDetecting || started.current) {
      return;
    }
    started.current = true;

    void (async () => {
      setDetecting(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const resolved = await resolvePlaceFromCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: 'gps',
        });

        setLocation({
          ...resolved,
          source: 'gps',
          updatedAt: Date.now(),
        });
      } catch {
        // user can pick manually from header
      } finally {
        setDetecting(false);
      }
    })();
  }, [hasHydrated, authHydrated, location, isDetecting, setDetecting, setLocation]);
}
