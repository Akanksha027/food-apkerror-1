import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Clock, Star, ChevronDown, Bike } from 'lucide-react-native';

import { fonts } from '@/constants/typography';

// ── Category Pills ──
const CATEGORIES = [
  { id: 'popular', label: 'Popular', active: true },
  { id: 'fast_food', label: 'FastFood', emoji: '🍔', active: false },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', active: false },
  { id: 'sushi', label: 'Sushi', emoji: '🍣', active: false },
  { id: 'desserts', label: 'Desserts', emoji: '🍰', active: false },
];

const FILTERS = [
  { id: 'sort', label: 'Sort' },
  { id: 'min_order', label: 'Min. order' },
  { id: 'cuisine', label: 'Cuisine' },
  { id: 'dietary', label: 'Dietary' },
];

// ── Mock restaurant data ──
const RESTAURANTS = [
  {
    id: '1',
    name: 'Burger Lands',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
    rating: '4.6',
    time: '30-40 min',
    deliveryFee: 'Free',
    minOrder: '$45',
  },
  {
    id: '2',
    name: 'Pizza House',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    rating: '4.8',
    time: '30-55 min',
    deliveryFee: 'Free',
    minOrder: '$25',
  },
  {
    id: '3',
    name: 'Sushi Palace',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
    rating: '4.9',
    time: '25-35 min',
    deliveryFee: '$2',
    minOrder: '$30',
  },
  {
    id: '4',
    name: 'Taco Town',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
    rating: '4.3',
    time: '20-30 min',
    deliveryFee: 'Free',
    minOrder: '$20',
  },
];

export function CategoryPillStrip({ style }: { style?: any }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.pillRow, style]}
    >
      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat.id}
          style={[styles.categoryPill, cat.active && styles.categoryPillActive]}
        >
          {cat.emoji ? <Text style={styles.categoryEmoji}>{cat.emoji}</Text> : null}
          <Text
            style={[
              styles.categoryLabel,
              cat.active && styles.categoryLabelActive,
            ]}
          >
            {cat.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function CategoriesSection({ restaurants = [] }: { restaurants?: any[] }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>
        <Text style={{ color: '#202020' }}>What's </Text>
        <Text style={{ color: '#A0A0A0', fontFamily: fonts.displayMedium }}>Your Craving </Text>
        <Text style={{ color: '#202020' }}>Today?</Text>
      </Text>

      {/* Category pills */}
      <CategoryPillStrip />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <Pressable key={f.id} style={styles.filterChip}>
            <Text style={styles.filterLabel}>{f.label}</Text>
            <ChevronDown color="#6B7280" size={14} strokeWidth={2.5} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Restaurant cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {(restaurants.length > 0 ? restaurants : RESTAURANTS).map((r) => {
          const isReal = restaurants.length > 0;
          const imageUri = isReal ? (r.coverUrl || r.imageUrl || r.logoUrl) : r.image;
          const name = r.name;
          const rating = isReal ? (typeof r.rating === 'number' && r.rating > 0 ? r.rating.toFixed(1) : '4.5') : r.rating;
          const time = isReal ? (r.deliveryTime || '25-30 min') : r.time;
          const deliveryFee = isReal ? (r.deliveryFee || 'Free') : r.deliveryFee;
          const minOrderText = isReal ? (r.costForTwo ? `₹${r.costForTwo} for two` : '₹200 for two') : `Min. order ${r.minOrder}`;

          return (
            <Pressable
              key={r.id}
              style={styles.card}
              onPress={() => router.push(`/restaurants/${r.id}`)}
            >
              {/* Image */}
              <View style={styles.cardImageWrap}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              {/* Heart */}
              <View style={styles.heartBtn}>
                <Heart color="#374151" size={18} strokeWidth={2} />
              </View>
            </View>

            {/* Info */}
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {name}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Star color="#F59E0B" size={12} fill="#F59E0B" />
                    <Text style={styles.ratingText}>{rating}</Text>
                  </View>
                </View>

                <View style={styles.cardMetaRow}>
                  <Clock color="#9CA3AF" size={12} strokeWidth={2.5} />
                  <Text style={styles.metaText}>{time}</Text>
                  <Bike color="#9CA3AF" size={12} strokeWidth={2} />
                  <Text style={styles.metaText}>{deliveryFee}</Text>
                </View>

                <Text style={styles.minOrder}>{minOrderText}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  // ── Category Pills ──
  pillRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 14,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryPillActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFFFFF',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: '#374151',
  },
  categoryLabelActive: {
    color: '#374151',
    fontFamily: fonts.uiBold,
  },

  // ── Filter Chips ──
  filterRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: '#374151',
  },

  // ── Cards ──
  cardsRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  card: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImageWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInfo: {
    padding: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: '#374151',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  metaText: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  minOrder: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
