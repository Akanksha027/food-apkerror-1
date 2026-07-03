import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Clock, Flame, Star } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureBadge } from '@/components/welcome/FeatureBadge';
import { PaginationDots } from '@/components/welcome/PaginationDots';
import { StatColumn } from '@/components/welcome/StatColumn';

const backgroundImage = require('@/assets/welcome-background.svg');
const logoImage = require('@/assets/Logo.png');

const BRAND_RED = '#7A0E22';

function WelcomeBackground() {
  if (Platform.OS === 'web') {
    return (
      <Image
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        transition={300}
      />
    );
  }

  // SVG backgrounds are unreliable in Expo Go on Android — use brand gradient instead.
  return (
    <LinearGradient
      colors={['#1A0508', '#3D0A14', '#7A0E22', '#2A0810']}
      locations={[0, 0.35, 0.65, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <View className="flex-1 bg-black">
      <WelcomeBackground />

      <LinearGradient
        colors={[
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.05)',
          'rgba(0,0,0,0.5)',
          'rgba(0,0,0,0.85)',
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 px-7">
          <View className="mt-10 items-center">
            <View className="w-full flex-row justify-between">
              <FeatureBadge icon={Flame} label="Hot & Fresh" />
              <FeatureBadge icon={Clock} label="20 min Delivery" />
            </View>
            <View className="mt-3">
              <FeatureBadge icon={Star} label="Top Rated" />
            </View>
          </View>

          <View className="flex-1 justify-end pb-10">
            <View className="mt-9 items-center">
              <Image
                source={logoImage}
                style={{ width: 300, height: 100, marginBottom: -8 }}
                contentFit="contain"
                contentPosition="top"
              />

              <Text
                className="max-w-[300px] text-center text-[14px] leading-[22px] text-white/90"
                style={{ marginTop: -4 }}
              >
                The quickest path from your hunger to ultimate satisfaction.
              </Text>
            </View>

            <Pressable
              onPress={handleGetStarted}
              className="mt-8 w-full flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90"
              style={{
                backgroundColor: BRAND_RED,
                paddingVertical: 14,
                shadowColor: '#7A0E22',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-[17px] font-bold text-white">
                Get Started
              </Text>
              <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
            </Pressable>

            <Pressable onPress={handleLogin} className="mt-4 items-center py-1">
              <Text className="text-[13px] text-white/80">
                Already have an account?{' '}
                <Text className="font-bold text-white">Login</Text>
              </Text>
            </Pressable>
          </View>

          <View className="mb-10">
            <View className="mb-4 h-px bg-white/20" />
            <View className="flex-row items-center justify-between px-1">
              <StatColumn value="50k+" label="USERS" />
              <StatColumn value="4.9" showStars />
              <StatColumn value="1k+" label="KITCHENS" />
            </View>
            <View className="mt-4">
              <PaginationDots />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
