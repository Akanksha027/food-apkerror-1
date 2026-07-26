import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => { if (router.canGoBack()) { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } } else { router.replace('/'); } }}
        style={styles.backButton}
        hitSlop={8}
      >
        <ChevronLeft color={authTheme.text} size={22} />
      </Pressable>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: '#02060C',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#686B78',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  spacer: {
    width: 40,
  },
});
