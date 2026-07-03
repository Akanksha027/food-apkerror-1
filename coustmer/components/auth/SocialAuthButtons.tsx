import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FacebookIcon } from '@/components/icons/FacebookIcon';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { colors } from '@/constants/colors';

type SocialAuthButtonsProps = {
  onGooglePress?: () => void;
  onFacebookPress?: () => void;
};

export function SocialAuthButtons({
  onGooglePress,
  onFacebookPress,
}: SocialAuthButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onGooglePress}
        style={({ pressed }) => [styles.button, styles.google, pressed && styles.pressed]}
      >
        <GoogleIcon size={18} />
        <Text style={styles.googleText}>Google</Text>
      </Pressable>

      <Pressable
        onPress={onFacebookPress}
        style={({ pressed }) => [styles.button, styles.facebook, pressed && styles.pressed]}
      >
        <FacebookIcon size={18} color="#FFFFFF" />
        <Text style={styles.facebookText}>Facebook</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    minHeight: 50,
  },
  google: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  facebook: {
    backgroundColor: '#1877F2',
  },
  pressed: {
    opacity: 0.88,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  facebookText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
