import { ChefHat, ClipboardList, Settings } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-8">
        <View className="mb-8 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ChefHat color="#FF6B35" size={28} />
          </View>
          <View>
            <Text className="text-2xl font-bold text-secondary">
              Restaurant Portal
            </Text>
            <Text className="text-sm text-secondary-light">
              Manage orders, menu & operations
            </Text>
          </View>
        </View>

        <View className="gap-4">
          <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <View className="mb-3 flex-row items-center gap-2">
              <ClipboardList color="#FF6B35" size={20} />
              <Text className="text-base font-semibold text-secondary">
                Live Orders
              </Text>
            </View>
            <Text className="text-sm text-secondary-light">
              View and update incoming orders in real time.
            </Text>
          </View>

          <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <View className="mb-3 flex-row items-center gap-2">
              <Settings color="#FF6B35" size={20} />
              <Text className="text-base font-semibold text-secondary">
                Menu Management
              </Text>
            </View>
            <Text className="text-sm text-secondary-light">
              Add items, set prices, and control availability.
            </Text>
          </View>
        </View>

        <View className="mt-auto mb-6 rounded-2xl bg-primary px-6 py-4">
          <Text className="text-center text-base font-semibold text-white">
            Open Dashboard
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
