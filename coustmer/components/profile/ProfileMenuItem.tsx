import { Pressable } from '@/components/common/Pressable';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type Props = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
  trailing?: React.ReactNode;
};

export function ProfileMenuItem({
  icon: Icon,
  label,
  subtitle,
  onPress,
  color = authTheme.brand,
  danger,
  trailing,
}: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}14` }]}>
        <Icon color={color} size={18} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ?? <ChevronRight color={authTheme.textMuted} size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: authTheme.cardBorder,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  labelDanger: {
    color: authTheme.error,
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
