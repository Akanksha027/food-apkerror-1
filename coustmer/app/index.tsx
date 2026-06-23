import { UtensilsCrossed } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <UtensilsCrossed color="#FF6B35" size={40} />
        </View>
        <Text className="text-3xl font-bold text-secondary">Food Delivery</Text>
        <Text className="mt-2 text-center text-base text-secondary-light">
          Your React Native app is ready. Start building your food delivery
          experience.
        </Text>
        <View className="mt-8 rounded-2xl bg-primary px-8 py-4">
          <Text className="text-base font-semibold text-white">Get Started</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
