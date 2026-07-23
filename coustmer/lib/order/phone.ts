/**
 * Normalize Indian mobile numbers for order-service validation.
 * Accepts: 9876543210, 919876543210, +919876543210, 09876543210
 */

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

/** 10-digit Indian mobile without country code, or null */
export function toTenDigitIndianMobile(input: string): string | null {
  const digits = digitsOnly(input);

  if (/^[6-9]\d{9}$/.test(digits)) return digits;
  if (/^0[6-9]\d{9}$/.test(digits)) return digits.slice(1);
  if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(2);

  return null;
}

/** E.164: +91XXXXXXXXXX */
export function toE164IndianMobile(input: string): string | null {
  const ten = toTenDigitIndianMobile(input);
  return ten ? `+91${ten}` : null;
}

/** 91XXXXXXXXXX (no plus) */
export function to91IndianMobile(input: string): string | null {
  const ten = toTenDigitIndianMobile(input);
  return ten ? `91${ten}` : null;
}

export function normalizeIndianPhone(input: string): string | null {
  return toE164IndianMobile(input);
}

export function isValidIndianPhone(input: string): boolean {
  return toTenDigitIndianMobile(input) != null;
}

/** Formats to try against backend validators that disagree on shape. */
export function indianPhoneVariants(input: string): string[] {
  const ten = toTenDigitIndianMobile(input);
  if (!ten) return [];

  // Prefer plain 10-digit first — many Indian order APIs reject +91 / 91 prefixes
  return [
    ten,
    `+91${ten}`,
    `91${ten}`,
    `0${ten}`,
  ];
}
