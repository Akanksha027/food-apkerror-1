import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type AuthPageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function AuthPageHeader({ title, subtitle, action }: AuthPageHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: authTheme.text,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: authTheme.textMuted,
    marginTop: 6,
    fontWeight: '400',
  },
  action: {
    marginTop: 14,
  },
});
