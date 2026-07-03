import { useRouter } from 'expo-router';
import {
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';

type Banner = { message: string; type: 'error' | 'success' } | null;

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const resendEmailVerification = useAuthStore((s) => s.resendEmailVerification);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [banner, setBanner] = useState<Banner>(null);
  const [action, setAction] = useState<'logout' | 'logoutAll' | 'resend' | null>(
    null
  );

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'User';

  const handleLogout = async () => {
    setAction('logout');
    setBanner(null);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      setBanner({
        message: error instanceof Error ? error.message : 'Logout failed',
        type: 'error',
      });
    } finally {
      setAction(null);
    }
  };

  const handleLogoutAll = async () => {
    setAction('logoutAll');
    setBanner(null);
    try {
      await logoutAll();
      router.replace('/login');
    } catch (error) {
      setBanner({
        message: error instanceof Error ? error.message : 'Logout failed',
        type: 'error',
      });
    } finally {
      setAction(null);
    }
  };

  const handleResendVerification = async () => {
    setAction('resend');
    setBanner(null);
    try {
      const message = await resendEmailVerification();
      setBanner({ message, type: 'success' });
    } catch (error) {
      setBanner({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to resend verification email',
        type: 'error',
      });
    } finally {
      setAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Account</Text>

        {banner ? (
          <AuthMessageBanner message={banner.message} type={banner.type} />
        ) : null}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User color={authTheme.accent} size={28} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone ? (
            <Text style={styles.phone}>{user.phone}</Text>
          ) : null}
        </View>

        {!user?.emailVerified ? (
          <View style={styles.verifyBanner}>
            <Mail color={authTheme.accent} size={20} />
            <View style={styles.verifyText}>
              <Text style={styles.verifyTitle}>Verify your email</Text>
              <Text style={styles.verifySubtitle}>
                Check your inbox or resend the verification link.
              </Text>
            </View>
            <Pressable
              onPress={handleResendVerification}
              disabled={isLoading}
              style={styles.verifyButton}
            >
              {action === 'resend' ? (
                <ActivityIndicator color={authTheme.accent} size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Resend</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/change-password')}
          >
            <View style={styles.menuIcon}>
              <KeyRound color={authTheme.text} size={18} />
            </View>
            <Text style={styles.menuLabel}>Change Password</Text>
            <ChevronRight color={authTheme.textMuted} size={18} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <View style={styles.menuIcon}>
              <LogOut color={authTheme.text} size={18} />
            </View>
            <Text style={styles.menuLabel}>Logout</Text>
            {action === 'logout' ? (
              <ActivityIndicator color={authTheme.textMuted} size="small" />
            ) : (
              <ChevronRight color={authTheme.textMuted} size={18} />
            )}
          </Pressable>

          <Pressable
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={handleLogoutAll}
            disabled={isLoading}
          >
            <View style={[styles.menuIcon, styles.menuIconDanger]}>
              <Shield color={authTheme.error} size={18} />
            </View>
            <Text style={[styles.menuLabel, styles.menuLabelDanger]}>
              Logout from all devices
            </Text>
            {action === 'logoutAll' ? (
              <ActivityIndicator color={authTheme.error} size="small" />
            ) : (
              <ChevronRight color={authTheme.error} size={18} />
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back to Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: authTheme.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: authTheme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    color: authTheme.text,
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    color: authTheme.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  phone: {
    color: authTheme.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
    padding: 14,
    marginBottom: 20,
  },
  verifyText: {
    flex: 1,
  },
  verifyTitle: {
    color: authTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  verifySubtitle: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  verifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verifyButtonText: {
    color: authTheme.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    backgroundColor: authTheme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: authTheme.cardBorder,
  },
  menuItemDanger: {
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: authTheme.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuLabel: {
    flex: 1,
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '500',
  },
  menuLabelDanger: {
    color: authTheme.error,
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    color: authTheme.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
