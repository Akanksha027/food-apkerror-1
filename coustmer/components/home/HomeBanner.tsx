import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { HomeBanner as HomeBannerType } from '@/lib/customer/types';

export function HomeBanner({ banner }: { banner: HomeBannerType }) {
  return (
    <View style={styles.card}>
      {banner.imageUrl ? (
        <Image
          source={{ uri: banner.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      ) : null}
      <View style={styles.overlay}>
        <Text style={styles.title}>{banner.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: authTheme.brand,
    justifyContent: 'flex-end',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    padding: 16,
    backgroundColor: 'rgba(122, 14, 34, 0.35)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
});
