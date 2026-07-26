import { ArrowRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const BUTTON_RED = '#FF5A41';

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function AuthPrimaryButton({
  label,
  onPress,
  disabled,
}: AuthPrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <View style={styles.button}>
        <Text style={styles.label}>{label}</Text>
        <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 28,
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: BUTTON_RED,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
