import { CheckCircle, Lock, Shield } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

const badges = [
  { icon: Shield, label: 'SECURE' },
  { icon: Lock, label: 'ENCRYPTED' },
  { icon: CheckCircle, label: 'VERIFIED' },
] as const;

export function TrustBadges() {
  return (
    <View style={styles.row}>
      {badges.map((badge, index) => (
        <View key={badge.label} style={styles.badgeGroup}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.badge}>
            <badge.icon color={colors.text.muted} size={20} strokeWidth={2} />
            <Text style={styles.label}>{badge.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    width: '100%',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: 18,
  },
  badge: {
    alignItems: 'center',
    width: 72,
  },
  label: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
