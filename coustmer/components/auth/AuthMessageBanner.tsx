import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type AuthMessageBannerProps = {
  message: string;
  type?: 'error' | 'success' | 'info';
};

export function AuthMessageBanner({
  message,
  type = 'info',
}: AuthMessageBannerProps) {
  const palette =
    type === 'error'
      ? { bg: '#FEF2F2', border: '#FECACA', text: authTheme.error }
      : type === 'success'
        ? { bg: '#F0FDF4', border: '#BBF7D0', text: authTheme.success }
        : { bg: authTheme.brandSoft, border: authTheme.brandMuted, text: authTheme.brand };

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
