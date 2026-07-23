import axios from 'axios';

import { api } from '@/lib/api';
import { postMultipartWithFieldFallback } from '@/lib/multipart-upload';
import type { CreateRestaurantPayload, RestaurantOwnerRestaurant } from '@/lib/restaurant/types';

const RESTAURANT_BASE = '/api/v1/restaurant-service/restaurants';

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function mapRestaurant(data: Record<string, unknown>): RestaurantOwnerRestaurant {
  return {
    id: String(data._id ?? data.id ?? ''),
    name: String(data.name ?? ''),
    description: (data.description as string) || undefined,
    logoUrl: (data.logoUrl as string) || (data.logo as string) || undefined,
    coverUrl: (data.coverUrl as string) || (data.coverImage as string) || undefined,
    status: (data.status as string) || (data.verificationStatus as string) || undefined,
    ...data,
  };
}

function extractError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Network request failed. Check your internet and try again.';
    const data = error.response.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || `Request failed (${error.response.status})`;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Strip empty optionals — matches the working PowerShell POST body shape. */
export function buildCreateRestaurantPayload(
  input: CreateRestaurantPayload
): CreateRestaurantPayload {
  const payload: CreateRestaurantPayload = {
    name: input.name.trim(),
    address: {
      street: input.address.street.trim(),
      city: input.address.city.trim(),
      state: input.address.state.trim(),
      country: input.address.country.trim() || 'India',
      pincode: input.address.pincode.trim(),
    },
    location: {
      type: 'Point',
      /** GeoJSON order: [longitude, latitude] — matches PowerShell coordinates @(lng, lat) */
      coordinates: [input.location.coordinates[0], input.location.coordinates[1]],
    },
  };

  const description = input.description?.trim();
  if (description) payload.description = description;

  const fssai = input.fssaiLicense?.trim();
  if (fssai) payload.fssaiLicense = fssai;

  const gstin = input.gstin?.trim();
  if (gstin) payload.gstin = gstin;

  if (input.priceRange) payload.priceRange = input.priceRange;

  if (typeof input.costForTwo === 'number' && input.costForTwo > 0) {
    payload.costForTwo = input.costForTwo;
  }

  const area = input.address.area?.trim();
  if (area) payload.address.area = area;

  return payload;
}

async function uploadRestaurantImage(
  restaurantId: string,
  endpoint: 'logo' | 'cover',
  file: { uri: string; fileName: string; mimeType: string },
  fieldCandidates: string[]
) {
  const uploadFile = {
    uri: file.uri,
    name: file.fileName || `${endpoint}.jpg`,
    type: file.mimeType || 'image/jpeg',
  };

  const data = await postMultipartWithFieldFallback(
    `${RESTAURANT_BASE}/${restaurantId}/${endpoint}`,
    uploadFile,
    fieldCandidates
  );

  return mapRestaurant(data);
}

export const restaurantOwnerApi = {
  createRestaurant: async (payload: CreateRestaurantPayload): Promise<RestaurantOwnerRestaurant> => {
    try {
      const body = buildCreateRestaurantPayload(payload);
      const res = await api.post<Envelope<Record<string, unknown>>>(RESTAURANT_BASE, body, {
        withCredentials: true,
      });
      const data = (res.data?.data ?? res.data) as Record<string, unknown>;
      const mapped = mapRestaurant(data);
      if (!mapped.id) throw new Error('Restaurant creation failed (missing id)');
      return mapped;
    } catch (error) {
      throw new Error(extractError(error, 'Failed to create restaurant'));
    }
  },

  getMyRestaurant: async (): Promise<RestaurantOwnerRestaurant | null> => {
    try {
      const res = await api.get<Envelope<Record<string, unknown>>>(
        `${RESTAURANT_BASE}/my`,
        { withCredentials: true }
      );
      const data = (res.data?.data ?? res.data) as Record<string, unknown>;
      const mapped = mapRestaurant(data);
      return mapped.id ? mapped : null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      const msg = extractError(error, 'Failed to load restaurant');
      throw new Error(msg);
    }
  },

  uploadLogo: async (
    restaurantId: string,
    file: { uri: string; fileName: string; mimeType: string }
  ) =>
    uploadRestaurantImage(restaurantId, 'logo', file, [
      'logo',
      'image',
      'file',
      'logoImage',
      'photo',
    ]),

  uploadCover: async (
    restaurantId: string,
    file: { uri: string; fileName: string; mimeType: string }
  ) =>
    uploadRestaurantImage(restaurantId, 'cover', file, [
      'cover',
      'image',
      'file',
      'coverImage',
      'photo',
    ]),
};
