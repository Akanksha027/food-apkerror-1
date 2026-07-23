/**
 * Address Service types.
 * Gateway: /api/v1/address-service
 * Routes: /addresses, /health
 */

/** API enum values (lowercase). */
export type AddressLabel = 'home' | 'work' | 'other' | string;

export const ADDRESS_LABEL_OPTIONS: Array<{
  value: 'home' | 'work' | 'other';
  title: string;
}> = [
  { value: 'home', title: 'Home' },
  { value: 'work', title: 'Work' },
  { value: 'other', title: 'Other' },
];

/** Normalize any UI/API label to the backend enum. */
export function toAddressLabelEnum(label?: string | null): 'home' | 'work' | 'other' {
  const raw = String(label ?? '').trim().toLowerCase();
  if (raw === 'work') return 'work';
  if (raw === 'other') return 'other';
  if (raw === 'home') return 'home';
  // Custom labels still need a valid enum — store as other.
  return raw ? 'other' : 'home';
}

export function formatAddressLabel(label?: string | null): string {
  const raw = String(label ?? '').trim();
  if (!raw) return 'Home';
  const lower = raw.toLowerCase();
  if (lower === 'home') return 'Home';
  if (lower === 'work') return 'Work';
  if (lower === 'other') return 'Other';
  return raw;
}

export type SavedAddress = {
  id: string;
  label: AddressLabel;
  formattedAddress: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  contactName?: string;
  contactPhone?: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAddressPayload = {
  label: AddressLabel;
  formattedAddress: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  contactName?: string;
  contactPhone?: string;
  lat: number;
  lng: number;
  setAsDefault?: boolean;
};

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export type AddressSuggestion = {
  description: string;
  placeId?: string;
  [key: string]: unknown;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress?: string;
  [key: string]: unknown;
};
