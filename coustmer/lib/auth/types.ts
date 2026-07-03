export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailVerified?: boolean;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  message?: string;
};

export type RegisterPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type OtpSendPayload = {
  emailOrPhone: string;
  purpose?: 'login' | 'register' | 'verification';
};

export type OtpVerifyPayload = {
  emailOrPhone: string;
  otp: string;
  purpose?: 'login' | 'register' | 'verification';
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword?: string;
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
  confirmPassword?: string;
};

export type MessageResponse = {
  message: string;
};
