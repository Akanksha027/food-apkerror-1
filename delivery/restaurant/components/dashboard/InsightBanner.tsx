import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import type { DashboardInsight } from '@/lib/dashboard/types';

type Props = {
  insight: DashboardInsight;
};

export function InsightBanner({ insight }: Props) {
  const titleLines = insight.title.replace(/\n/g, ' ').split(' ');
  const mid = Math.ceil(titleLines.length / 2);
  const line1 = titleLines.slice(0, mid).join(' ');
  const line2 = titleLines.slice(mid).join(' ');

  return (
    <LinearGradient
      colors={['#FF8A4C', '#E24A2C', '#7A0E22']}
      locations={[0, 0.42, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.orb} />
      <View style={styles.orbSmall} />

      <View style={styles.row}>
        <View style={styles.chip}>
          <Sparkles color="#FFE7C7" size={11} />
          <Text style={styles.chipText}>INSIGHT</Text>
        </View>
        <View style={styles.trendChip}>
          <TrendingUp color="#FFFFFF" size={13} />
          <Text style={styles.trendText}>
            {insight.trendPercent >= 0 ? '+' : ''}
            {insight.trendPercent}%
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{line1}</Text>
      {line2 ? <Text style={styles.title}>{line2}</Text> : null}
      <Text style={styles.subtitle}>{insight.subtitle}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#E24A2C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    minHeight: 148,
  },
  orb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -50,
    right: -30,
  },
  orbSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    bottom: -30,
    left: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 10,
    fontFamily: fonts.extraBold,
    letterSpacing: 1.4,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  trendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.extraBold,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
    maxWidth: 260,
  },
});
