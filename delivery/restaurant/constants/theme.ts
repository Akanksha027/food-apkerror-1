/** Shared brand palette — mirrors customer app + tailwind.config.js */
export const theme = {
  primary: '#7A0E22',
  primaryDark: '#5A0A18',
  primaryLight: '#9E1A32',
  secondary: '#0F172A',
  secondaryLight: '#64748B',
  surface: '#F6F6F7',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#94A3B8',
  border: '#EBEBEB',
  white: '#FFFFFF',
} as const;

export const BRAND_NAME = 'Gourmet Direct';

export const buttonGradient = ['#7A0E22', '#5A0A18'] as const;
export const heroGradient = ['#7A0E22', '#5A0A18'] as const;

export const cardShadow = {
  shadowColor: '#1E293B',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
