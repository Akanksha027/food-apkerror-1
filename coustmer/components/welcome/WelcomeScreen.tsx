import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { AuthBottomSheet } from '@/components/auth/AuthBottomSheet';
import { useAuthSheetStore, type AuthSheetView } from '@/store/auth-sheet-store';
import { authTheme } from '@/constants/auth-theme';

type Props = {
  openAuthOnMount?: AuthSheetView;
};

function resolveAuthParam(auth?: string | string[]): AuthSheetView | null {
  const value = Array.isArray(auth) ? auth[0] : auth;
  if (value === 'login') return 'login';
  if (value === 'sign-up' || value === 'register') return 'register';
  if (value === 'forgot-password') return 'forgot-password';
  if (value === 'verify-otp') return 'verify-otp';
  return null;
}

export function WelcomeScreen({ openAuthOnMount }: Props) {
  const { auth, identifier } = useLocalSearchParams<{ auth?: string; identifier?: string }>();
  const visible = useAuthSheetStore((s) => s.visible);
  const view = useAuthSheetStore((s) => s.view);
  const otpIdentifier = useAuthSheetStore((s) => s.otpIdentifier);
  const open = useAuthSheetStore((s) => s.open);
  const close = useAuthSheetStore((s) => s.close);
  const setView = useAuthSheetStore((s) => s.setView);

  useEffect(() => {
    if (openAuthOnMount) {
      open(openAuthOnMount);
    }
  }, [openAuthOnMount, open]);

  useEffect(() => {
    const resolved = resolveAuthParam(auth);
    if (!resolved) return;

    if (resolved === 'verify-otp' && identifier) {
      open('verify-otp', { otpIdentifier: String(identifier) });
      return;
    }

    open(resolved);
  }, [auth, identifier, open]);

  const handleGetStarted = () => {
    open('login');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[authTheme.heroStart, authTheme.heroEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.titleLine1}>Delicious</Text>
            <Text style={styles.titleLine1}>Food</Text>
            <Text style={styles.titleLine2}>Menu</Text>
          </View>

          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Image
                source={require('../../public/bg.png')}
                style={styles.foodImage}
                contentFit="contain"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleGetStarted}
              style={styles.startButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[authTheme.brand, authTheme.brandDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.startButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <AuthBottomSheet
        visible={visible}
        view={view}
        otpIdentifier={otpIdentifier}
        onClose={close}
        onViewChange={setView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 32,
  },
  titleLine1: {
    fontSize: 76,
    fontWeight: '900',
    color: authTheme.text,
    lineHeight: 82,
    letterSpacing: -2,
  },
  titleLine2: {
    fontSize: 76,
    fontWeight: '900',
    color: authTheme.brand,
    lineHeight: 82,
    letterSpacing: -2,
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '140%',
    height: 480,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerSubtext: {
    marginTop: 18,
    fontSize: 14,
    color: authTheme.textMuted,
    fontWeight: '600',
  },
});
