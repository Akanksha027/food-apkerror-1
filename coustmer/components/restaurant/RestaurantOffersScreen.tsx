import { Pressable } from '@/components/common/Pressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Percent, Tag, TrendingUp } from 'lucide-react-native';
import { FlatList,
  
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import { useRestaurantOffers } from '@/lib/restaurant/offers-hooks';
import type { Offer } from '@/lib/restaurant/offers-api';
import { formatOfferValue, isOfferValid } from '@/lib/restaurant/offers-api';

export function RestaurantOffersScreen() {
  const router = useRouter();
  const { restaurantId, restaurantName } = useLocalSearchParams<{
    restaurantId: string;
    restaurantName?: string;
  }>();

  const id = String(restaurantId ?? '');
  const name = String(restaurantName ?? 'Restaurant');

  const offers = useRestaurantOffers(id);

  const activeOffers = (offers.data?.offers ?? []).filter(isOfferValid);

  const refetch = () => {
    offers.refetch();
  };

  const refreshing = offers.isRefetching;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title="Offers & Deals"
          subtitle={name}
          left={
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color={authTheme.text} size={20} />
            </Pressable>
          }
          right={
            <View style={styles.iconBadge}>
              <Tag color={authTheme.brand} size={18} />
            </View>
          }
        />
      </View>

      {offers.isLoading ? (
        <LoadingView label="Loading offers…" />
      ) : offers.isError ? (
        <ErrorView
          message={
            offers.error instanceof Error
              ? offers.error.message
              : 'Failed to load offers'
          }
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={activeOffers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor={authTheme.brand}
            />
          }
          ListEmptyComponent={
            <EmptyView
              title="No active offers"
              subtitle="Check back later for exciting deals!"
            />
          }
          renderItem={({ item }) => <OfferCard offer={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const discountText = formatOfferValue(offer);
  const validUntil = new Date(offer.validUntil);
  const daysLeft = Math.ceil(
    (validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.offerCard}>
      {offer.imageUrl && (
        <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} />
      )}
      
      <View style={styles.offerContent}>
        <View style={styles.offerHeader}>
          <View style={styles.discountBadge}>
            <Percent color="#FFFFFF" size={16} strokeWidth={3} />
            <Text style={styles.discountText}>{discountText}</Text>
          </View>
          
          {daysLeft <= 3 && (
            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyText}>
                {daysLeft === 0 ? 'Last Day!' : `${daysLeft}d left`}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.offerTitle}>{offer.title}</Text>
        <Text style={styles.offerDescription} numberOfLines={2}>
          {offer.description}
        </Text>

        <View style={styles.offerDetails}>
          {offer.code && (
            <View style={styles.codeChip}>
              <Tag color={authTheme.brand} size={14} />
              <Text style={styles.codeText}>{offer.code}</Text>
            </View>
          )}
          
          {offer.minOrderAmount && (
            <View style={styles.detailChip}>
              <TrendingUp color={authTheme.textMuted} size={14} />
              <Text style={styles.detailText}>
                Min ₹{offer.minOrderAmount}
              </Text>
            </View>
          )}
          
          <View style={styles.detailChip}>
            <Calendar color={authTheme.textMuted} size={14} />
            <Text style={styles.detailText}>
              Until {validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>

        {offer.termsAndConditions && (
          <Text style={styles.terms} numberOfLines={1}>
            {offer.termsAndConditions}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authTheme.bg },
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.surface,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.brandSoft,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  offerCard: {
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerImage: {
    width: '100%',
    height: 160,
    backgroundColor: authTheme.surface,
  },
  offerContent: {
    padding: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: authTheme.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  urgencyBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: authTheme.text,
    marginBottom: 6,
  },
  offerDescription: {
    fontSize: 14,
    color: authTheme.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  offerDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: authTheme.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: authTheme.brand,
    borderStyle: 'dashed',
  },
  codeText: {
    color: authTheme.brand,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: authTheme.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailText: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  terms: {
    fontSize: 11,
    color: authTheme.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
});