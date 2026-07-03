import { Clock, ShieldCheck, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

const items = [
  { icon: Clock, label: '20 min delivery' },
  { icon: ShieldCheck, label: 'Secure' },
  { icon: Star, label: '4.9 rated' },
] as const;

export function AuthTrustBadges() {
  return (
    <View style={styles.wrap}>
      {items.map(({ icon: Icon, label }, index) => (
        <View key={label} style={styles.item}>
          {index > 0 ? <View style={styles.dot} /> : null}
          <Icon color={authTheme.foodAccent} size={13} strokeWidth={2.5} />
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: authTheme.textMuted,
  },
});
