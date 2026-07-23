import * as Location from 'expo-location';

import { reverseGeocodeAddress } from '@/lib/address/search';
import {
  extractCityFromAddress,
  isCoordinateFallbackAddress,
  normalizeCityName,
  normalizeLat,
  normalizeLng,
  shortAddressLabel,
} from '@/lib/location/format';
import type { DeliveryLocation } from '@/store/delivery-location-store';

export type ResolvedPlace = {
  label: string;
  formattedAddress: string;
  city?: string;
  lat: number;
  lng: number;
};

/** Turn lat/lng into a human address + city name (never "Lat … / Lng …"). */
export async function resolvePlaceFromCoords(input: {
  lat: number;
  lng: number;
  source?: DeliveryLocation['source'];
  preferredAddress?: string;
}): Promise<ResolvedPlace> {
  const lat = normalizeLat(input.lat);
  const lng = normalizeLng(input.lng);

  let formatted =
    input.preferredAddress &&
    !isCoordinateFallbackAddress(input.preferredAddress)
      ? input.preferredAddress
      : null;

  if (!formatted) {
    formatted = await reverseGeocodeAddress({ lat, lng });
  }

  let city: string | undefined;
  let areaName: string | undefined;

  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (place) {
      city = place.city || place.subregion || place.district || undefined;
      areaName =
        place.name ||
        place.street ||
        place.district ||
        place.subregion ||
        undefined;

      if (!formatted) {
        const parts = [
          place.name,
          place.street,
          place.district,
          place.city,
          place.region,
        ]
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i);
        formatted = parts.join(', ') || null;
      }
    }
  } catch {
    // ignore — Google reverse may still have worked
  }

  if (!formatted) {
    formatted = 'Selected location';
  }

  const fromAddress = normalizeCityName(extractCityFromAddress(formatted));
  const fromDevice = normalizeCityName(city);
  city = fromAddress || fromDevice;

  if (city && isCoordinateFallbackAddress(city)) {
    city = undefined;
  }

  const labelSource = input.source === 'gps' ? 'gps' : 'search';
  let label = shortAddressLabel(formatted, labelSource);
  if (label === 'Current location' || label === 'Selected location') {
    label = areaName || city || label;
  }

  return {
    label,
    formattedAddress: formatted,
    city,
    lat,
    lng,
  };
}

export function isBadStoredLocation(location: DeliveryLocation | null): boolean {
  if (!location) return false;
  if (isCoordinateFallbackAddress(location.formattedAddress)) return true;
  if (isCoordinateFallbackAddress(location.label)) return true;
  if (location.city && isCoordinateFallbackAddress(location.city)) return true;
  if (location.city && /^lng\b/i.test(location.city)) return true;
  if (Math.abs(location.lng) > 180) return true;
  return false;
}
