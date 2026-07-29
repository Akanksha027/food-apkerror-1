import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerAnalytics } from '@/components/customer/CustomerAnalytics';

export default function CustomerInsightsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <CustomerAnalytics />
    </SafeAreaView>
  );
}