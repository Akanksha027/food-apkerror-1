import axios, { AxiosHeaders } from 'axios';

import { getToken } from '@/lib/auth/storage';

/** Cookie session marker stored when API uses Set-Cookie instead of JWT. */
const SESSION_AUTH_TOKEN = 'session';

const DEFAULT_API_BASE_URL = 'http://api.viharfood.in';

function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export function assertApiBaseUrl(): void {
  if (!/^https?:\/\//i.test(API_BASE_URL)) {
    throw new Error(
      'API URL is not configured. Add EXPO_PUBLIC_API_URL=http://api.viharfood.in to .env and restart Expo with npm run start:clear.'
    );
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/** Fetch CSRF via axios so the cookie jar is shared with later POSTs on mobile. */
export async function refreshCsrfToken(force = false): Promise<string> {
  if (!force && csrfToken) return csrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const { data } = await api.get<{ csrfToken?: string; success?: boolean }>(
        '/api/csrf-token'
      );

      const token = data?.csrfToken;
      if (!token) {
        throw new Error('Server did not return a security token');
      }

      csrfToken = token;
      return token;
    } catch (error) {
      csrfToken = null;
      throw error;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

/** Quick connectivity check — call from auth screens on mount. */
export async function checkApiConnection(): Promise<boolean> {
  try {
    const response = await api.get('/health', { timeout: 10000 });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}

function applyCsrfHeader(headers: AxiosHeaders, token: string) {
  headers.set('X-CSRF-Token', token);
}

api.interceptors.request.use(async (config) => {
  const headers = AxiosHeaders.from(config.headers);
  const authToken = await getToken();

  if (authToken && authToken !== SESSION_AUTH_TOKEN) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const method = config.method?.toLowerCase();
  const isMutating = method && MUTATING_METHODS.has(method);

  if (isMutating) {
    const token = await refreshCsrfToken(true);
    applyCsrfHeader(headers, token);
  }

  config.headers = headers;
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const message =
      error.response?.data?.message ?? error.response?.data?.error ?? '';

    const isCsrfError =
      typeof message === 'string' &&
      message.toLowerCase().includes('csrf') &&
      original &&
      !original._csrfRetry;

    if (isCsrfError) {
      original._csrfRetry = true;
      clearCsrfToken();
      const token = await refreshCsrfToken(true);
      const headers = AxiosHeaders.from(original.headers);
      applyCsrfHeader(headers, token);
      original.headers = headers;
      original.withCredentials = true;
      return api(original);
    }

    return Promise.reject(error);
  }
);

declare module 'axios' {
  export interface AxiosRequestConfig {
    _csrfRetry?: boolean;
  }
}
