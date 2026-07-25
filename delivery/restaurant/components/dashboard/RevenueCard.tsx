import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, Info, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { splitCurrency } from '@/lib/dashboard/format';
import type { DashboardMetrics } from '@/lib/dashboard/types';

type Props = {
  metrics: DashboardMetrics;
};

export function RevenueCard({ metrics }: Props) {
  const { whole, fraction } = splitCurrency(metrics.grossRevenue);
  const yesterday = splitCurrency(metrics.yesterdayRevenue);
  const maxBar = Math.max(...metrics.revenueBars, 1);

  return (
    <View style={styles.card}>
      <LinearGradient colors={['#FFF8F5', '#FFFFFF']} style={styles.fill} />
      <View style={styles.top}>
        <View style={styles.left}>
          <LinearGradient colors={['#FFE0D1', '#FFD0BC']} style={styles.iconWrap}>
            <Wallet color={authTheme.brand} size={18} />
          </LinearGradient>
          <View>
            <Text style={styles.label}>GROSS REVENUE</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amount}>{whole}</Text>
              {fraction ? <Text style={styles.fraction}>{fraction}</Text> : null}
            </View>
          </View>
        </View>
        <View style={styles.todayChip}>
          <Text style={styles.todayText}>Today</Text>
        </View>
      </View>

      <View style={styles.chart}>
        {metrics.revenueBars.map((value, index) => {
          const height = Math.max(22, Math.round((value / maxBar) * 84));
          const isLast = index === metrics.revenueBars.length - 1;
          if (isLast) {
            return (
              <LinearGradient
                key={`bar-${index}`}
                colors={['#FF6B35', '#7A0E22']}
                style={[styles.bar, { height }]}
              />
            );
          }
          return (
            <View
              key={`bar-${index}`}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: `rgba(122,14,34,${0.14 + index * 0.14})`,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.trendRow}>
          <View style={styles.trendBadge}>
            <ArrowUpRight color={authTheme.success} size={12} />
            <Text style={styles.trendPct}>{Math.abs(metrics.revenueTrendPercent)}%</Text>
          </View>
          <Text style={styles.vsText}>
            vs {yesterday.whole}
            {yesterday.fraction} yesterday
          </Text>
        </View>
        <Info color={authTheme.textDim} size={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.08)',
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#7A0E22',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: authTheme.textMuted,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  amount: {
    color: authTheme.text,
    fontSize: 30,
    fontFamily: fonts.extraBold,
    letterSpacing: -1,
  },
  fraction: {
    color: authTheme.textDim,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    marginBottom: 4,
    marginLeft: 1,
  },
  todayChip: {
    backgroundColor: 'rgba(122,14,34,0.08)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.1)',
  },
  todayText: {
    color: authTheme.brand,
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  chart: {
    height: 96,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  bar: {
    width: 44,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(122,14,34,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendPct: {
    color: authTheme.success,
    fontSize: 12,
    fontFamily: fonts.extraBold,
  },
  vsText: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
});
