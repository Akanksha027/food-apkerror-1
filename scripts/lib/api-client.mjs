const DEFAULT_BASE = 'http://api.viharfood.in';

export function getApiBase() {
  const raw =
    process.env.API_URL?.trim() ||
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    DEFAULT_BASE;
  return raw.replace(/\/+$/, '');
}

function parseSetCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return list
    .map((c) => String(c).split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function mergeCookies(existing, incoming) {
  const jar = new Map();
  for (const part of `${existing};${incoming}`.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function parseJsonResponse(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function extractError(data, status) {
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  if (data?.errors) {
    const flat = Object.values(data.errors).flat().filter(Boolean);
    if (flat.length) return flat.join('; ');
  }
  return `HTTP ${status}`;
}

export class ApiClient {
  constructor(baseUrl = getApiBase()) {
    this.baseUrl = baseUrl;
    this.cookies = '';
    this.csrfToken = '';
  }

  async login(email, password) {
    await this.refreshCsrf();
    const res = await fetch(`${this.baseUrl}/api/v1/user-service/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.cookies ? { Cookie: this.cookies } : {}),
        ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}),
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(extractError(data, res.status));

    const setCookie = res.headers.getSetCookie?.() ?? res.headers.get('set-cookie');
    this.cookies = mergeCookies(this.cookies, parseSetCookie(setCookie));
    await this.refreshCsrf();
    return data;
  }

  async refreshCsrf() {
    const res = await fetch(`${this.baseUrl}/api/csrf-token`, {
      headers: this.cookies ? { Cookie: this.cookies } : {},
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(extractError(data, res.status));
    if (!data.csrfToken) throw new Error('CSRF token missing');
    this.csrfToken = data.csrfToken;

    const setCookie = res.headers.getSetCookie?.() ?? res.headers.get('set-cookie');
    this.cookies = mergeCookies(this.cookies, parseSetCookie(setCookie));
  }

  async request(path, { method = 'GET', body } = {}) {
    const headers = {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(this.cookies ? { Cookie: this.cookies } : {}),
    };

    const isMutating = method !== 'GET';
    if (isMutating) {
      if (!this.csrfToken) await this.refreshCsrf();
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = res.headers.getSetCookie?.() ?? res.headers.get('set-cookie');
    this.cookies = mergeCookies(this.cookies, parseSetCookie(setCookie));

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      const err = new Error(extractError(data, res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async getAllRestaurants() {
    const all = [];
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= 100) {
      const res = await this.request(
        `/api/v1/restaurant-service/restaurants?page=${page}&limit=50&sort=-createdAt`
      );
      const batch = Array.isArray(res.data) ? res.data : [];
      all.push(...batch);
      hasNext = Boolean(res.meta?.hasNext) && batch.length > 0;
      page += 1;
      if (batch.length === 0) break;
      await sleep(400);
    }

    return all;
  }

  async getItemCount(restaurantId) {
    const res = await this.request(
      `/api/v1/restaurant-service/restaurants/${restaurantId}/items?limit=1`
    );
    return res.meta?.total ?? (Array.isArray(res.data) ? res.data.length : 0);
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getId(record) {
  return String(record?._id ?? record?.id ?? '');
}
