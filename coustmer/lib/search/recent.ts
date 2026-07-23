import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'customer.search.recent.v1';
const MAX_RECENT = 12;

export async function loadLocalRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function pushLocalRecentSearch(term: string): Promise<string[]> {
  const cleaned = term.trim();
  if (!cleaned) return loadLocalRecentSearches();

  const existing = await loadLocalRecentSearches();
  const next = [
    cleaned,
    ...existing.filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
  ].slice(0, MAX_RECENT);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearLocalRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function removeLocalRecentSearch(term: string): Promise<string[]> {
  const existing = await loadLocalRecentSearches();
  const next = existing.filter(
    (item) => item.toLowerCase() !== term.trim().toLowerCase()
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
