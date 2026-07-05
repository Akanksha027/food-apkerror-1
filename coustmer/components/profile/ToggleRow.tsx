import { StyleSheet, Switch, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type Props = {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: authTheme.inputBorder, true: authTheme.brandMuted }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: authTheme.cardBorder,
    gap: 12,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
