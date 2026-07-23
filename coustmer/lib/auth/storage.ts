import type { AuthUser } from '@/lib/auth/types';
import { clearSessionCookies } from '@/lib/session-cookies';
import {
  storageDeleteItem,
  storageGetItem,
  storageSetItem,
} from '@/lib/storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const READ_TIMEOUT_MS = 5000;

async function withTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  ms = READ_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function getToken(): Promise<string | null> {
  return withTimeout(storageGetItem(TOKEN_KEY), null);
}

export async function setToken(token: string): Promise<void> {
  await storageSetItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storageDeleteItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const raw = await withTimeout(storageGetItem(USER_KEY), null);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  await storageSetItem(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  await storageDeleteItem(USER_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([clearToken(), clearStoredUser(), clearSessionCookies()]);
}
