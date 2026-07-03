import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Search, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { resetOnboarding } from '@/lib/onboarding';
import { useAuthStore } from '@/store/auth-store';

const logoImage = require('@/assets/Logo.png');

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    router.replace('/');
  };

  const greeting =
    user?.firstName?.trim() || user?.email?.split('@')[0] || 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={logoImage}
              style={styles.logo}
              contentFit="contain"
            />
            <View>
              <Text style={styles.brandAccent}>Vibrant</Text>
              <Text style={styles.brandName}>Cravings</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton}>
              <Search color={authTheme.text} size={20} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push('/profile')}
            >
              <User color={authTheme.text} size={20} />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.greeting}>Hey {greeting} 👋</Text>
          <Text style={styles.title}>What are you craving?</Text>
          <Text style={styles.subtitle}>
            Browse restaurants, add to cart, and get food delivered fast.
          </Text>
        </View>

        <Pressable onPress={handleResetOnboarding} style={styles.devButton}>
          <Text style={styles.devButtonText}>Preview welcome screen again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  brandAccent: {
    color: authTheme.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandName: {
    color: authTheme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authTheme.card,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  greeting: {
    color: authTheme.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
  title: {
    color: authTheme.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
  },
  devButton: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    paddingVertical: 12,
  },
  devButtonText: {
    textAlign: 'center',
    color: authTheme.textMuted,
    fontSize: 13,
  },
});
