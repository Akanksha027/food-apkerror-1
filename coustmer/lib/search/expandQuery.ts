/**
 * Expand short typed prefixes to the full dish name so live search
 * (no Enter) still opens the Pizza / Biryani / … results UI.
 */

const DISH_NAMES = [
  'Pizza',
  'Burger',
  'Biryani',
  'Momos',
  'Pasta',
  'Sandwich',
  'Noodles',
  'Thali',
  'Dosa',
  'Chicken',
  'Cake',
  'Sweets',
  'Roll',
  'Ice Cream',
] as const;

/** If the user typed a prefix of a dish (e.g. "piz"), return the full label. */
export function expandSearchQuery(raw: string): string {
  const q = raw.trim();
  if (!q) return q;
  const lower = q.toLowerCase();

  // Prefer the longest dish name that starts with what they typed (min 2 chars)
  if (lower.length >= 2) {
    let best: string | null = null;
    for (const name of DISH_NAMES) {
      const n = name.toLowerCase();
      if (n === lower) return name;
      if (n.startsWith(lower) && (!best || name.length > best.length)) {
        best = name;
      }
    }
    if (best) return best;
  }

  return q;
}

/** Canonical dish label for headers / variety chips. */
export function displaySearchLabel(raw: string): string {
  return expandSearchQuery(raw);
}
