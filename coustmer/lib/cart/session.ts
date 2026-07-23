import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_SESSION_KEY = 'cart-guest-session-id';

function createSessionId() {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable guest cart session for OptAuth cart-service calls. */
export async function getCartSessionId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(CART_SESSION_KEY);
    if (existing) return existing;
    const next = createSessionId();
    await AsyncStorage.setItem(CART_SESSION_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
}

export async function clearCartSessionId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CART_SESSION_KEY);
  } catch {
    // ignore
  }
}
