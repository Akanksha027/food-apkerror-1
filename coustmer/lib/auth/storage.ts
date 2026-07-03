import * as SecureStore from 'expo-secure-store';

import type { AuthUser } from '@/lib/auth/types';

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
  try {
    return await withTimeout(SecureStore.getItemAsync(TOKEN_KEY), null);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const raw = await withTimeout(SecureStore.getItemAsync(USER_KEY), null);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // ignore
  }
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([clearToken(), clearStoredUser()]);
}
