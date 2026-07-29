import { Pressable } from '@/components/common/Pressable';
import { ActivityIndicator,  StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={authTheme.brand} size="large" />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyView({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.center}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  icon: {
    marginBottom: 4,
  },
  muted: {
    color: authTheme.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    color: authTheme.error,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: authTheme.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
