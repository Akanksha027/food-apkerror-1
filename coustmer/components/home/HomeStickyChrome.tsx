import { Platform, StyleSheet, View } from 'react-native';

import { CategoryStripPhotos } from '@/components/home/CategoryStripPhotos';
import { HomeSearchBar } from '@/components/home/HomeHeader';
import type { HomeCategory } from '@/lib/home/types';

type Props = {
  categories: HomeCategory[];
  categoriesLoading?: boolean;
  topInset?: number;
  /** Stronger shadow once the chrome is pinned under the status bar. */
  elevated?: boolean;
  /** Search in sticky bar (false while search lives in the red header). */
  showSearch?: boolean;
  /** Compact category strip for the pinned overlay. */
  compactCategories?: boolean;
};

export function HomeStickyChrome({
  categories,
  categoriesLoading,
  topInset = 0,
  elevated = false,
  showSearch = true,
  compactCategories = false,
}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        !showSearch && !elevated && styles.wrapCategoriesOnly,
        { paddingTop: Math.max(topInset, 0) + (elevated ? 4 : showSearch ? 8 : 0) },
        elevated && styles.wrapElevated,
      ]}
    >
      {showSearch ? <HomeSearchBar compact /> : null}
      <CategoryStripPhotos
        categories={categories}
        loading={categoriesLoading}
        sticky={compactCategories || elevated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  wrapCategoriesOnly: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8E8',
  },
  wrapElevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
    zIndex: 20,
  },
});
