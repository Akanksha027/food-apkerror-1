import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView, EmptyView } from '@/components/common/StateViews';
import { SmoothPressable } from '@/components/common/SmoothPressable';
import { OrderCard } from '@/components/order/OrderCard';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useOrders } from '@/lib/order/hooks';

const PAGE_BG = '#FFFFFF';
const TEXT_DARK = '#202020';
const BANNER_BG = '#F9F1EB';
const BANNER_ICON_BG = '#F3744B';

export function OrdersHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bannerVisible, setBannerVisible] = useState(true);

  const all = useOrders({ limit: 50 });
  const orders = all.data?.orders ?? [];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SmoothPressable onPress={goBack} style={styles.backBtn} pressScale={0.9} hitSlop={8}>
          <ChevronLeft color={TEXT_DARK} size={24} strokeWidth={2.5} />
        </SmoothPressable>
        <Text style={styles.title}>Your orders</Text>
        <View style={styles.headerRight} />
      </View>

      {all.isLoading ? (
        <LoadingView label="Loading orders…" />
      ) : all.isError ? (
        <ErrorView
          message={all.error instanceof Error ? all.error.message : 'Failed to load orders'}
          onRetry={all.refetch}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={all.isRefetching}
              onRefresh={all.refetch}
              tintColor={authTheme.brand}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {bannerVisible && (
                <View style={styles.banner}>
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerGridMock}>
                      <View style={styles.gridRow}>
                        <View style={styles.gridCellActive} />
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell} />
                      </View>
                      <View style={styles.gridRow}>
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell} />
                      </View>
                      <View style={styles.gridRow}>
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell} />
                      </View>
                      <View style={styles.gridRow}>
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell} />
                      </View>
                    </View>
                    <Text style={styles.bannerText}>See how it works</Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => setBannerVisible(false)} style={styles.bannerClose}>
                    <X color="#303030" size={16} strokeWidth={2} />
                  </Pressable>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={<EmptyView title="No orders yet" subtitle="Place an order to see it here." />}
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 44,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: TEXT_DARK,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listHeader: {
    paddingBottom: 16,
  },
  banner: {
    backgroundColor: BANNER_BG,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    position: 'relative',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerGridMock: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderTopWidth: 6,
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  gridCellActive: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: BANNER_ICON_BG,
  },
  gridCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  bannerText: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: TEXT_DARK,
    textDecorationLine: 'underline',
  },
  bannerClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
