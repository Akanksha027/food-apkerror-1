import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { authTheme } from '@/constants/auth-theme';
import { useCustomerServiceHealth } from '@/lib/customer/hooks';

export function CustomerServiceStatus() {
  const { data: isHealthy, isError } = useCustomerServiceHealth();

  if (isHealthy || !isError) {
    return null; // Don't show anything when healthy
  }

  return (
    <View style={styles.container}>
      <WifiOff color={authTheme.error} size={16} />
      <Text style={styles.text}>Customer service temporarily unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${authTheme.error}10`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: authTheme.error,
    fontWeight: '500',
  },
});