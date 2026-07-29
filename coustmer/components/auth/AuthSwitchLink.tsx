import { Pressable } from '@/components/common/Pressable';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type AuthSwitchLinkProps = {
  text: string;
  linkText: string;
  onPress: () => void;
};

export function AuthSwitchLink({ text, linkText, onPress }: AuthSwitchLinkProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{text} </Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={styles.link}>{linkText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    color: authTheme.textMuted,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: authTheme.brand,
  },
});
