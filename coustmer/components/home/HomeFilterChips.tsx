import { Pressable } from '@/components/common/Pressable';
import { ChevronDown, SlidersHorizontal, Zap } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type Props = {
  activeFilter?: string | null;
  onFilterPress?: (id: string) => void;
};

const FILTERS = [
  { id: 'filter', label: 'Filter', icon: 'sliders' as const },
  { id: 'sort', label: 'Sort by', chevron: true },
  { id: 'store99', label: '99 Store' },
  { id: 'fast', label: 'Bolt', bolt: true, trailing: '15 mins' },
  { id: 'rating', label: 'Ratings 4.0+' },
  { id: 'offers', label: 'Offers', chevron: true },
];

export function HomeFilterChips({ activeFilter, onFilterPress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((f) => {
        const on = activeFilter === f.id;
        return (
          <Pressable
            key={f.id}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onFilterPress?.(f.id)}
          >
            {f.icon === 'sliders' ? (
              <SlidersHorizontal color="#3E4152" size={13} strokeWidth={2.4} />
            ) : null}
            <Text style={[styles.text, on && styles.textOn]}>{f.label}</Text>
            {f.bolt ? <Zap color={authTheme.brand} size={12} fill={authTheme.brand} /> : null}
            {f.trailing ? (
              <Text style={[styles.text, on && styles.textOn]}>{f.trailing}</Text>
            ) : null}
            {f.chevron ? (
              <ChevronDown color="#686B78" size={14} strokeWidth={2.4} />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E2E7',
  },
  chipOn: {
    borderColor: authTheme.brand,
    backgroundColor: authTheme.brandSoft,
  },
  text: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: '#3E4152',
  },
  textOn: {
    color: authTheme.brand,
  },
});
