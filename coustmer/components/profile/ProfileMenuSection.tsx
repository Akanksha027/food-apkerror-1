import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

export function ProfileMenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: authTheme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
  },
});
