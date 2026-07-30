import { Pressable } from '@/components/common/Pressable';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  MoreVertical,
  Search,
  Star,
  Clock
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { CartFloatingBar } from '@/components/order/CartFloatingBar';
import { MenuItemRow } from '@/components/restaurant/MenuItemRow';
import { MenuItemDetailSheet } from '@/components/restaurant/MenuItemDetailSheet';
import { authTheme } from '@/constants/auth-theme';
import { addMenuItemToCart } from '@/lib/order/add-to-cart';
import {
  useFullMenu,
  useRestaurant,
} from '@/lib/restaurant/hooks';
import type { MenuItem } from '@/lib/restaurant/types';

export function RestaurantDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    restaurantId: string;
  }>();

  const id = Array.isArray(params.restaurantId) ? params.restaurantId[0] : params.restaurantId;

  const [tab, setTab] = useState<'Menu' | 'Reviews' | 'Info' | 'Offers'>('Menu');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const restaurant = useRestaurant(id);
  const menu = useFullMenu(id, {
    name: restaurant.data?.name,
    cuisines: restaurant.data?.cuisines,
  });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const addItem = (item: MenuItem) => {
    addMenuItemToCart(item, {
      id,
      name: restaurant.data?.name || 'Restaurant',
      imageUrl: restaurant.data?.logoUrl || restaurant.data?.imageUrl,
    });
  };

  if (restaurant.isLoading) {
    return <LoadingView label="Loading restaurant…" />;
  }

  if (restaurant.isError || !restaurant.data) {
    return (
      <View style={styles.errorWrap}>
        <ErrorView
          message={
            restaurant.error instanceof Error
              ? restaurant.error.message
              : 'Restaurant not found'
          }
          onRetry={restaurant.refetch}
        />
      </View>
    );
  }

  const r = restaurant.data;
  const cover = r.coverUrl || r.imageUrl || 'https://images.unsplash.com/photo-1614707693022-79018e698822?q=80&w=600&auto=format&fit=crop';
  const logo = r.logoUrl || r.imageUrl;
  
  // Example specific fallbacks to match the UI if data is missing
  const restaurantName = r.name || 'Subway';
  const ratingText = typeof r.rating === 'number' ? `${r.rating.toFixed(1)}` : '4.7';
  const reviewsCount = typeof r.reviewCount === 'number' ? `(${r.reviewCount}+)` : '(570+)';
  const locationText = r.address || 'Vaghavadi road, Bhavnagar';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Banner Section */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: cover }} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.3)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.topBar, { top: 16 }]}>
            <Pressable onPress={goBack} style={styles.backBtn}>
              <ChevronLeft color="#FFFFFF" size={24} />
            </Pressable>

            <Pressable style={styles.iconBtn}>
              <MoreVertical color="#FFFFFF" size={24} />
            </Pressable>
          </View>

          <View style={styles.timePill}>
            <Clock color="#202020" size={14} />
            <Text style={styles.timePillText}>30 min</Text>
          </View>

          {/* Logo overlapping the banner */}
          <View style={styles.logoWrap}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} contentFit="cover" />
            ) : (
              <Text style={styles.logoFallback}>{restaurantName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoBox}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{restaurantName}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{ratingText} <Star color="#F5B041" fill="#F5B041" size={12} /> {reviewsCount}</Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <MapPin color="#9CA3AF" size={14} />
            <Text style={styles.locationText}>{locationText}</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {['Menu', 'Reviews', 'Info', 'Offers'].map((t) => (
              <Pressable 
                key={t} 
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t as any)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Menu Section */}
        {tab === 'Menu' && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Popular picks</Text>
            {menu.isLoading ? (
              <LoadingView label="Loading menu…" />
            ) : (
              menu.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  onPress={() => setSelectedItem(item)}
                  onAdd={() => addItem(item)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {selectedItem ? (
        <MenuItemDetailSheet
          item={selectedItem}
          restaurantId={id}
          restaurantName={restaurant.data?.name}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}

      <CartFloatingBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F7', // Overall light grey background as per mockup
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroWrap: {
    height: 220,
    width: '100%',
    position: 'relative',
    marginBottom: 40, // Space for the overlapping logo
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  iconBtn: {
    padding: 8,
  },
  timePill: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#202020',
  },
  logoWrap: {
    position: 'absolute',
    bottom: -32,
    left: 20,
    width: 72,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    padding: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  logoFallback: {
    fontSize: 32,
    fontWeight: '800',
    color: authTheme.brand,
  },
  infoBox: {
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#202020',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202020',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingRight: 20,
  },
  tab: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#F3744B',
  },
  tabText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  menuSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202020',
    marginLeft: 20,
    marginBottom: 16,
  },
});
