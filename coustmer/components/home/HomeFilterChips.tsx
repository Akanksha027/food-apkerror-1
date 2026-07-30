import { Pressable } from '@/components/common/Pressable';
import { ChevronDown } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';

type Props = {
  activeFilter?: string | null;
  onFilterPress?: (id: string) => void;
};

const FILTERS = [
  { id: 'fast_food', label: 'Fast Food', chevron: true, isPrimary: true },
  { id: 'sort', label: 'Sort By', chevron: true },
  { id: 'popular', label: 'The Most Popular' },
];

export function HomeFilterChips({ activeFilter, onFilterPress }: Props) {
  return (
    <View style={styles.container}>
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
              style={[
                styles.chip,
                f.isPrimary && styles.chipPrimary,
              ]}
              onPress={() => onFilterPress?.(f.id)}
            >
              <Text style={[
                styles.text,
                f.isPrimary && styles.textPrimary
              ]}>{f.label}</Text>
              
              {f.chevron ? (
                <ChevronDown 
                  color={f.isPrimary ? "#FFFFFF" : "#111827"} 
                  size={14} 
                  strokeWidth={2.5} 
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    // Shadow for white pills
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipPrimary: {
    backgroundColor: '#F97316',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: '#111827',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
});
