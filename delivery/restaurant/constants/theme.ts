/** Shared brand palette — mirrors tailwind.config.js for use in non-className props. */
export const theme = {
  primary: '#9E1B32',
  primaryDark: '#6E0F1B',
  primaryLight: '#C24A5E',
  secondary: '#1A1D1F',
  secondaryLight: '#6B7280',
  surface: '#F2F3F5',
  success: '#0EA968',
  warning: '#F59E0B',
  danger: '#DC2626',
  muted: '#9CA3AF',
  border: '#EAEAEC',
  white: '#FFFFFF',
} as const;

/** Product brand shown as the wordmark across auth screens. */
export const BRAND_NAME = 'Gourmet Direct';

/** Gradient stops for the primary CTA button (top → bottom). */
export const buttonGradient = ['#8E1A2B', '#6E0F1B'] as const;

/** Gradient stops for solid maroon headers. */
export const heroGradient = ['#9E1B32', '#6E0F1B'] as const;

/** Standard soft card shadow. */
export const cardShadow = {
  shadowColor: '#111827',
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
  elevation: 4,
} as const;
