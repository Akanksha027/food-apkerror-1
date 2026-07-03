import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

const logoImage = require('@/assets/Logo.png');

type AuthBrandHeaderProps = {
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export function AuthBrandHeader({
  title,
  subtitle,
  compact = false,
}: AuthBrandHeaderProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Image
        source={logoImage}
        style={[styles.logo, compact && styles.logoCompact]}
        contentFit="contain"
        contentPosition="center"
      />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 28,
  },
  compact: {
    marginBottom: 20,
  },
  logo: {
    width: 160,
    height: 56,
    marginBottom: 16,
  },
  logoCompact: {
    width: 140,
    height: 48,
    marginBottom: 12,
  },
  title: {
    color: authTheme.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
});
