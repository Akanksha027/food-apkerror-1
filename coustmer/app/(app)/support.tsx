import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOrders } from '@/lib/order/hooks';
import { authTheme } from '@/constants/auth-theme';

export default function SupportHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Fetch latest order
  const { data: ordersData } = useOrders({ page: 1, limit: 1 });
  const recentOrder = ordersData?.orders?.[0];

  const queries = [
    { title: 'Swiggy One FAQs', route: '/support/faq-one' },
    { title: 'General issues', route: '/support/faq-general' },
    { title: 'Partner Onboarding', route: '/support/partner-onboarding' },
    { title: 'Report Safety Emergency', route: '/support/safety' },
    { title: 'Instamart Onboarding', route: '/support/instamart-onboarding' },
    { title: 'Legal, Terms & Conditions', route: '/support/legal' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafe, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft color="#1C1C1C" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Refunds Card */}
        <View style={styles.refundsCard}>
          <View style={styles.refundsTextWrap}>
            <Text style={styles.refundsTitle}>You have 0 active refund</Text>
            <Pressable onPress={() => {}}>
              <Text style={styles.viewRefundsText}>VIEW MY REFUNDS {'>'}</Text>
            </Pressable>
          </View>
          <View style={styles.refundIconWrap}>
            <RotateCcw color={authTheme.textMuted} size={24} />
          </View>
        </View>

        {/* Recent Order */}
        {recentOrder && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT ORDER</Text>
            <Pressable 
              style={styles.orderCard}
              onPress={() => router.push({ pathname: '/support/new', params: { orderId: recentOrder.id } })}
            >
              <View style={styles.orderTop}>
                <View>
                  <Text style={styles.restaurantName}>{recentOrder.restaurantName}</Text>
                  <Text style={styles.orderMeta}>
                    {recentOrder.deliveryAddress?.label || 'Home'} | ₹{recentOrder.total || 0}
                  </Text>
                </View>
                {recentOrder.status === 'delivered' && (
                  <View style={styles.statusWrap}>
                    <Text style={styles.statusText}>Delivered</Text>
                    <CheckCircle2 color="#16A34A" size={14} />
                  </View>
                )}
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.orderBottom}>
                <Text style={styles.itemsText} numberOfLines={1}>
                  {recentOrder.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                </Text>
                <Text style={styles.dateText}>
                  {new Date(recentOrder.createdAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Other Queries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HELP WITH OTHER QUERIES</Text>
          <View style={styles.queriesCard}>
            {queries.map((q, idx) => (
              <View key={idx}>
                <Pressable 
                  style={styles.queryRow}
                  onPress={() => {
                    // Navigate to static pages if they existed, or stub for now
                  }}
                >
                  <Text style={styles.queryText}>{q.title}</Text>
                  <ChevronRight color={authTheme.textDim} size={18} />
                </Pressable>
                {idx < queries.length - 1 && <View style={styles.queryDivider} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerSafe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  refundsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  refundsTextWrap: {
    gap: 8,
  },
  refundsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  viewRefundsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F15700',
    textTransform: 'uppercase',
  },
  refundIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderTop: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  orderBottom: {
    padding: 16,
  },
  itemsText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  queriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  queryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  queryText: {
    fontSize: 15,
    color: '#1C1C1C',
    fontWeight: '500',
  },
  queryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 18,
  },
});
