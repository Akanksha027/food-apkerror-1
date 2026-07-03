import axios from 'axios';

import { api, assertApiBaseUrl } from '@/lib/api';
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  OtpSendPayload,
  OtpVerifyPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/lib/auth/types';

/** Live API mounts auth under user-service (not /auth at root). */
const AUTH_BASE = '/api/v1/user-service/auth';

/** Cookie session auth — no JWT in response body. */
export const SESSION_AUTH_TOKEN = 'session';

function mapApiUser(data: Record<string, unknown>): AuthUser {
  return {
    id: String(data._id ?? data.id ?? ''),
    email: String(data.email ?? ''),
    firstName: (data.firstName as string) || undefined,
    lastName: (data.lastName as string) || undefined,
    phone: (data.phone as string) || undefined,
    emailVerified: Boolean(data.isEmailVerified ?? data.emailVerified ?? false),
  };
}

function normalizeAuthResponse(data: unknown): AuthResponse {
  const payload = data as Record<string, unknown>;
  const nested = payload.data as Record<string, unknown> | undefined;

  const token =
    (payload.token as string) ||
    (payload.accessToken as string) ||
    (payload.access_token as string) ||
    (nested?.token as string) ||
    SESSION_AUTH_TOKEN;

  const userSource = (nested ?? payload.user ?? payload) as Record<string, unknown>;
  const user = mapApiUser(userSource);

  if (!user.id || !user.email) {
    throw new Error('Invalid authentication response from server');
  }

  return { token, user, message: payload.message as string | undefined };
}

function normalizeMessageResponse(data: unknown): MessageResponse {
  const payload = data as { message?: string };
  return { message: payload.message ?? 'Success' };
}

function extractErrorMessage(data: unknown, fallback: string): string {
  const payload = data as {
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
  } | null;

  if (payload?.errors) {
    const details = Object.values(payload.errors).flat().filter(Boolean);
    if (details.length > 0) {
      return details.join('\n');
    }
  }

  return payload?.message || payload?.error || fallback;
}

async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options;

  assertApiBaseUrl();

  try {
    const response = await api.request<T>({
      url: path,
      method,
      data: body,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error(
          'Network request failed. Check your internet connection and try again.'
        );
      }

      const message = extractErrorMessage(
        error.response.data,
        `Request failed (${error.response.status})`
      );

      if (message.toLowerCase().includes('csrf')) {
        throw new Error(
          'Security token expired. Close and reopen the app, then try again.'
        );
      }

      if (message.includes('generatePasswordResetToken')) {
        throw new Error(
          'Password reset failed on the server. Ask backend to fix User.generatePasswordResetToken in AuthService.forgotPassword (user query must return a Mongoose document, not a plain object).'
        );
      }

      throw new Error(message);
    }

    throw error;
  }
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/register`, {
      method: 'POST',
      body: payload,
    });
    return normalizeAuthResponse(data);
  },

  login: async (payload: LoginPayload) => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/login`, {
      method: 'POST',
      body: payload,
    });
    return normalizeAuthResponse(data);
  },

  sendOtp: async (payload: OtpSendPayload) => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/otp/send`, {
      method: 'POST',
      body: {
        identifier: payload.emailOrPhone,
        purpose: payload.purpose ?? 'login',
      },
    });
    return normalizeMessageResponse(data);
  },

  verifyOtp: async (payload: OtpVerifyPayload) => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/otp/verify`, {
      method: 'POST',
      body: {
        identifier: payload.emailOrPhone,
        otp: payload.otp,
        purpose: payload.purpose ?? 'login',
      },
    });
    return normalizeAuthResponse(data);
  },

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/forgot-password`, {
      method: 'POST',
      body: payload,
    });
    return normalizeMessageResponse(data);
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/reset-password`, {
      method: 'POST',
      body: {
        token: payload.token,
        password: payload.password,
        confirmPassword: payload.confirmPassword ?? payload.password,
      },
    });
    return normalizeMessageResponse(data);
  },

  verifyEmail: async (token: string) => {
    const data = await apiRequest<unknown>(
      `${AUTH_BASE}/email/verify/${token}`
    );
    return normalizeMessageResponse(data);
  },

  logout: async () => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/logout`, {
      method: 'POST',
    });
    return normalizeMessageResponse(data);
  },

  logoutAll: async () => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/logout-all`, {
      method: 'POST',
    });
    return normalizeMessageResponse(data);
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/change-password`, {
      method: 'POST',
      body: {
        currentPassword: payload.oldPassword,
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword ?? payload.newPassword,
      },
    });
    return normalizeMessageResponse(data);
  },

  resendEmailVerification: async () => {
    const data = await apiRequest<unknown>(`${AUTH_BASE}/email/send-verify`, {
      method: 'POST',
    });
    return normalizeMessageResponse(data);
  },
};
