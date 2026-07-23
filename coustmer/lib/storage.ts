import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * SecureStore is native-only. On web its methods are stubs / missing and throw
 * "setValueWithKeyAsync is not a function". Use AsyncStorage there instead.
 */
const isWeb = Platform.OS === 'web';

export async function storageGetItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function storageDeleteItem(key: string): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}
