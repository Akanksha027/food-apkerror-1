import { LinearGradient } from 'expo-linear-gradient';
import { Gauge, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { DashboardMetrics } from '@/lib/dashboard/types';

type Props = {
  metrics: DashboardMetrics;
};

export function MetricCards({ metrics }: Props) {
  return (
    <View style={styles.row}>
      <LinearGradient colors={['#FFF9EF', '#FFFFFF']} style={styles.card}>
        <View style={styles.cardTop}>
          <LinearGradient colors={['#FFE8A8', '#FFD56A']} style={styles.iconWrap}>
            <Star color="#B45309" fill="#F59E0B" size={18} />
          </LinearGradient>
          <View style={styles.stars}>
            {[0, 1, 2].map((i) => (
              <Star key={i} color="#F59E0B" fill="#F59E0B" size={9} />
            ))}
          </View>
        </View>
        <Text style={styles.label}>CUSTOMER RATING</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>
            {metrics.rating > 0 ? metrics.rating.toFixed(1) : '—'}
          </Text>
          <Text style={styles.valueSuffix}>/ {metrics.ratingMax.toFixed(1)}</Text>
        </View>
        <Text style={styles.caption}>{metrics.totalRatings} total ratings</Text>
      </LinearGradient>

      <LinearGradient colors={['#F0FBFF', '#FFFFFF']} style={styles.card}>
        <View style={styles.cardTop}>
          <LinearGradient colors={['#CFF4FF', '#8BDEFF']} style={styles.iconWrap}>
            <Gauge color="#0369A1" size={18} />
          </LinearGradient>
          {metrics.isOnline ? <View style={styles.onlineDot} /> : null}
        </View>
        <Text style={styles.label}>AVG. DELIVERY</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{metrics.avgDeliveryMinutes}</Text>
          <Text style={styles.minLabel}>MIN</Text>
        </View>
        <Text style={styles.caption}>Live optimization on</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    padding: 16,
    minHeight: 156,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    opacity: 0.85,
  },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: authTheme.success,
  },
  label: {
    color: authTheme.textMuted,
    fontSize: 10,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  value: {
    color: authTheme.text,
    fontSize: 28,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.7,
  },
  valueSuffix: {
    color: authTheme.textDim,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 4,
    marginLeft: 4,
  },
  minLabel: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.extraBold,
    marginBottom: 4,
    marginLeft: 4,
    letterSpacing: 1,
  },
  caption: {
    color: authTheme.textMuted,
    fontSize: 11,
    fontFamily: fonts.bold,
    marginTop: 4,
  },
});
