import { LinearGradient } from 'expo-linear-gradient';
import { UtensilsCrossed } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';

type AuthScreenLayoutProps = {
  children: ReactNode;
  scrollable?: boolean;
  footer?: ReactNode;
};

export function AuthScreenLayout({
  children,
  scrollable = true,
  footer,
}: AuthScreenLayoutProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[authTheme.heroStart, authTheme.heroMid, authTheme.heroEnd]}
        locations={[0, 0.55, 1]}
        style={styles.heroGradient}
      />
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.brandBar}>
          <View style={styles.brandMark}>
            <UtensilsCrossed color="#FFFFFF" size={20} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={styles.brandName}>Vibrant Cravings</Text>
            <Text style={styles.brandTag}>Delivered hot & fresh</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS === 'ios'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.card}>
            <View style={styles.handle} />
            {scrollable ? (
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              >
                {children}
                {footer ? <View style={styles.footer}>{footer}</View> : null}
              </ScrollView>
            ) : (
              <View style={styles.scrollContent}>
                {children}
                {footer ? <View style={styles.footer}>{footer}</View> : null}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authTheme.surface,
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  decorCircle1: {
    position: 'absolute',
    top: 60,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: authTheme.foodAccentSoft,
  },
  decorCircle2: {
    position: 'absolute',
    top: 120,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: authTheme.brandSoft,
  },
  safe: {
    flex: 1,
  },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 12,
    color: authTheme.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  flex: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: authTheme.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    flexGrow: 1,
  },
  footer: {
    marginTop: 20,
    paddingTop: 4,
  },
});
