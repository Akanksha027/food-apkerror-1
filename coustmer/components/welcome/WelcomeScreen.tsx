import { useLocalSearchParams } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBottomSheet } from '@/components/auth/AuthBottomSheet';
import { WelcomeDecor } from '@/components/welcome/WelcomeDecor';
import { WelcomeLogoMark } from '@/components/welcome/WelcomeLogoMark';
import { authTheme } from '@/constants/auth-theme';
import { useAuthSheetStore, type AuthSheetView } from '@/store/auth-sheet-store';

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
      <WelcomeDecor />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <WelcomeLogoMark width={236} height={204} />
            <Text style={styles.brandName}>FOODCORT</Text>
            <Text style={styles.tagline}>FOOD DELIVER SERVICE</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleGetStarted}
              style={styles.startButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
            >
              <ChevronDown color={authTheme.brand} size={28} strokeWidth={2.6} />
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
    backgroundColor: authTheme.brand,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  brandName: {
    marginTop: 28,
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 4.8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  startButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
});
