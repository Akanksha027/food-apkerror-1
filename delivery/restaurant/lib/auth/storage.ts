import * as SecureStore from 'expo-secure-store';

import type { AuthUser, PartnerRole } from '@/lib/auth/types';
import { clearSessionCookies } from '@/lib/session-cookies';

const TOKEN_KEY = 'partner_auth_token';
const USER_KEY = 'partner_auth_user';
const ROLE_KEY = 'partner_selected_role';
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

/** Remember the last role the partner picked so the toggle is pre-selected. */
export async function getStoredRole(): Promise<PartnerRole | null> {
  try {
    const raw = await withTimeout(SecureStore.getItemAsync(ROLE_KEY), null);
    return raw === 'restaurant' || raw === 'delivery' ? raw : null;
  } catch {
    return null;
  }
}

export async function setStoredRole(role: PartnerRole): Promise<void> {
  try {
    await SecureStore.setItemAsync(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([clearToken(), clearStoredUser(), clearSessionCookies()]);
}
