/** Raw menu item shape from API or mapped MenuItem. */
export type MenuItemRatingSource = {
  rating?: unknown;
  avgRating?: unknown;
  tags?: unknown;
} | null | undefined;

function parsePositiveNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function tagValue(tags: unknown[], prefix: string): number | null {
  const match = tags.find((t) =>
    new RegExp(`^${prefix}:`, 'i').test(String(t))
  );
  if (!match) return null;
  const value = Number(String(match).split(':')[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Menu dish rating: direct fields, then seed-rating:4.5 in tags. */
export function getMenuItemRating(item: MenuItemRatingSource): number | null {
  if (!item) return null;

  const direct = parsePositiveNumber(item.rating ?? item.avgRating);
  if (direct != null) return direct;

  const tags = Array.isArray(item.tags) ? item.tags : [];
  return tagValue(tags, 'seed-rating');
}

/** Review count from seed-reviews:120 in tags (optional display). */
export function getMenuItemReviewCount(item: MenuItemRatingSource): number | null {
  if (!item) return null;

  const direct = parsePositiveNumber(
    (item as Record<string, unknown>).reviewCount ??
      (item as Record<string, unknown>).totalRatings
  );
  if (direct != null) return direct;

  const tags = Array.isArray(item.tags) ? item.tags : [];
  return tagValue(tags, 'seed-reviews');
}

/** Restaurant rating: avgRating first, then rating. */
export function getRestaurantRating(source: MenuItemRatingSource): number | null {
  if (!source) return null;
  return (
    parsePositiveNumber(source.avgRating) ??
    parsePositiveNumber(source.rating)
  );
}
