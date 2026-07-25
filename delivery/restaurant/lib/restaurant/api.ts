import axios from 'axios';

import { API_BASE_URL, api } from '@/lib/api';
import { postMultipartWithFieldFallback } from '@/lib/multipart-upload';
import type { CreateRestaurantPayload, RestaurantOwnerRestaurant } from '@/lib/restaurant/types';

const RESTAURANT_BASE = '/api/v1/restaurant-service/restaurants';

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_BASE_URL}${path}`;
}

/** GET /restaurants/my may return one restaurant or a list of owned restaurants. */
function extractOwnerRestaurantRecord(data: unknown): Record<string, unknown> | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    const first = data.find(
      (row) => row && typeof row === 'object' && String((row as Record<string, unknown>)._id ?? (row as Record<string, unknown>).id ?? '').trim()
    );
    return first && typeof first === 'object' ? (first as Record<string, unknown>) : null;
  }

  if (typeof data !== 'object') return null;

  const record = data as Record<string, unknown>;
  const nested =
    record.restaurant ??
    record.restaurants ??
    record.items ??
    record.results ??
    record.docs;

  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }

  if (Array.isArray(nested)) {
    return extractOwnerRestaurantRecord(nested);
  }

  if (String(record._id ?? record.id ?? '').trim()) {
    return record;
  }

  return null;
}

function mapRestaurant(data: Record<string, unknown>): RestaurantOwnerRestaurant {
  const logoUrl =
    resolveMediaUrl(
      (data.logoUrl as string) ||
        (data.logo as string) ||
        (data.logoImage as string) ||
        (data.logoPath as string)
    ) || undefined;

  const coverUrl =
    resolveMediaUrl(
      (data.coverUrl as string) ||
        (data.coverImage as string) ||
        (data.bannerUrl as string) ||
        (data.banner as string)
    ) || undefined;

  return {
    ...data,
    id: String(data._id ?? data.id ?? ''),
    name: String(data.name ?? data.restaurantName ?? ''),
    description: (data.description as string) || undefined,
    logoUrl,
    coverUrl,
    status: (data.status as string) || (data.verificationStatus as string) || undefined,
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
      const raw = res.data?.data ?? res.data;
      const record = extractOwnerRestaurantRecord(raw) ?? (raw as Record<string, unknown>);
      const mapped = mapRestaurant(record);
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
      const raw = res.data?.data ?? res.data;
      const record = extractOwnerRestaurantRecord(raw);
      if (!record) return null;
      const mapped = mapRestaurant(record);
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
