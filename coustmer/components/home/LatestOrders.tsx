import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Clock, Star } from 'lucide-react-native';

import { fonts } from '@/constants/typography';

const MOCK_ORDERS = [
  {
    id: '1',
    restaurantName: 'Burger King',
    category: 'Fast Food Category',
    time: '45-60 mins',
    rating: '4.5',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/1024px-Burger_King_2020.svg.png',
  },
  {
    id: '2',
    restaurantName: 'McDonalds',
    category: 'Fast Food Category',
    time: '25-30 mins',
    rating: '4.8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1024px-McDonald%27s_Golden_Arches.svg.png',
  },
];

export function LatestOrders() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Your <Text style={styles.titleBold}>latest</Text> orders
        </Text>
        <Text style={styles.viewAll}>View All &gt;</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {MOCK_ORDERS.map((order) => (
          <View key={order.id} style={styles.card}>
            {/* Logo Container */}
            <View style={styles.logoWrap}>
              <Image source={{ uri: order.logoUrl }} style={styles.logo} contentFit="contain" />
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={styles.category}>🍗 {order.category}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {order.restaurantName}
              </Text>
              <View style={styles.timeRow}>
                <Clock color="#9CA3AF" size={12} strokeWidth={2.5} />
                <Text style={styles.time}>{order.time}</Text>
              </View>
            </View>

            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
              <Star color="#FACC15" fill="#FACC15" size={10} strokeWidth={0} />
              <Text style={styles.ratingText}>{order.rating}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: '#111827',
  },
  titleBold: {
    fontFamily: fonts.displayBold,
  },
  viewAll: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: '#9CA3AF',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    paddingRight: 24, // extra space for absolute rating badge if needed, or just enough width
    width: 260,
    // Shadow
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  details: {
    marginLeft: 12,
    flex: 1,
    gap: 2,
  },
  category: {
    fontFamily: fonts.uiMedium,
    fontSize: 10,
    color: '#9CA3AF',
  },
  name: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  time: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: '#9CA3AF',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 2,
  },
  ratingText: {
    color: '#FFFFFF',
    fontFamily: fonts.uiBold,
    fontSize: 10,
  },
});
