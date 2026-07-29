import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import { Clock, Heart, LifeBuoy, Tag } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type Action = {
  label: string;
  caption: string;
  icon: typeof Tag;
  color: string;
  href: '/deals' | '/favorites' | '/recent' | '/support';
};

const ACTIONS: Action[] = [
  { label: 'Deals', caption: 'Save more', icon: Tag, color: '#E8590C', href: '/deals' },
  { label: 'Favorites', caption: 'Your loves', icon: Heart, color: '#DB2777', href: '/favorites' },
  { label: 'Recent', caption: 'Order again', icon: Clock, color: '#0891B2', href: '/recent' },
  { label: 'Support', caption: 'Get help', icon: LifeBuoy, color: '#16A34A', href: '/support' },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.href}
          style={styles.card}
          onPress={() => router.push(action.href)}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${action.color}18` }]}>
            <action.icon color={action.color} size={18} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
          <Text style={styles.caption}>{action.caption}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: -18,
  },
  card: {
    flex: 1,
    backgroundColor: authTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    color: authTheme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  caption: {
    color: authTheme.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
});
