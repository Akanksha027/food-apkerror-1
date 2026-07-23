import { API_BASE_URL } from '@/lib/api';

/** Resolve relative CDN/API image paths to absolute URLs. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_BASE_URL}${path}`;
}

/** Pull first usable image string from images[] payloads. */
export function firstImageFromList(images: unknown): string | undefined {
  if (!Array.isArray(images) || images.length === 0) return undefined;

  for (const item of images) {
    if (typeof item === 'string' && item.trim()) {
      return resolveMediaUrl(item);
    }
    if (item && typeof item === 'object') {
      const row = item as Record<string, unknown>;
      const candidate =
        (row.url as string) ||
        (row.src as string) ||
        (row.path as string) ||
        (row.secure_url as string) ||
        (row.imageUrl as string) ||
        (row.logoUrl as string) ||
        (row.coverUrl as string);
      const resolved = resolveMediaUrl(candidate);
      if (resolved) return resolved;
    }
  }
  return undefined;
}

/** Cuisine-based cover placeholders when partners haven't uploaded images yet. */
const CUISINE_COVERS: Record<string, string> = {
  pizza:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  biryani:
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
  burger:
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  chinese:
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80',
  indian:
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  north:
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  dessert:
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
  bakery:
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  coffee:
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  street:
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  italian:
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
  mexican:
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  seafood:
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  default:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
};

/** True for client stock/placeholder hosts — never treat as real partner media. */
export function isStockMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  return /unsplash\.com|picsum\.photos|via\.placeholder|placehold\.co|dummyimage|loremflickr/i.test(
    url
  );
}

/** Keep only real uploaded/CDN URLs from the API. */
export function onlyApiMediaUrl(url?: string | null): string | undefined {
  const resolved = resolveMediaUrl(url);
  if (!resolved || isStockMediaUrl(resolved)) return undefined;
  return resolved;
}

export function coverFallbackForCuisines(cuisines?: string[]): string {
  if (!cuisines?.length) return CUISINE_COVERS.default;
  const joined = cuisines.join(' ').toLowerCase();
  for (const [key, url] of Object.entries(CUISINE_COVERS)) {
    if (key !== 'default' && joined.includes(key)) return url;
  }
  return CUISINE_COVERS.default;
}
