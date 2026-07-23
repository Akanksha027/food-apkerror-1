import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { FOOD_CATEGORIES } from '@/lib/restaurant/categories';

export function CategoryGrid() {
  const router = useRouter();
  const visible = FOOD_CATEGORIES.slice(0, 8);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>What&apos;s on your mind?</Text>
        <Pressable
          style={styles.seeAll}
          onPress={() => router.push('/restaurants')}
          hitSlop={8}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight color={authTheme.brand} size={16} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {visible.map((cat) => (
          <Pressable
            key={cat.slug}
            style={styles.item}
            onPress={() =>
              router.push({ pathname: '/restaurants', params: { cuisine: cat.slug } })
            }
          >
            <View style={[styles.iconWrap, { backgroundColor: `${cat.color}14` }]}>
              <cat.icon color={cat.color} size={28} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: authTheme.text,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: authTheme.brand,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: authTheme.text,
    textAlign: 'center',
  },
});
