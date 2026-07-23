import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { FOOD_CATEGORIES } from '@/lib/restaurant/categories';

export function CategoryStrip() {
  const router = useRouter();

  const openCategory = (slug: string) => {
    router.push({
      pathname: '/restaurants',
      params: { cuisine: slug },
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>What&apos;s on your mind?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {FOOD_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.slug}
            style={styles.item}
            onPress={() => openCategory(cat.slug)}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${cat.color}18` }]}>
              <cat.icon color={cat.color} size={26} />
            </View>
            <Text style={styles.label}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
  },
  title: {
    color: authTheme.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 20,
    gap: 16,
  },
  item: {
    alignItems: 'center',
    width: 68,
    gap: 8,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: authTheme.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
