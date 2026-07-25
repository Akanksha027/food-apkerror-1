import {
  ClipboardList,
  Handshake,
  Tag,
  UtensilsCrossed,
} from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { DashboardQuickActions } from '@/lib/dashboard/types';

type Props = {
  actions: DashboardQuickActions;
  onOrdersPress?: () => void;
  onMenuPress?: () => void;
};

const CARDS = [
  {
    key: 'orders',
    label: 'Orders',
    captionKey: 'activeOrders' as const,
    captionSuffix: 'active',
    icon: ClipboardList,
    color: '#E8590C',
    tint: ['#FFF4EC', '#FFE8D6'] as const,
  },
  {
    key: 'menu',
    label: 'Menu',
    captionKey: 'menuItems' as const,
    captionSuffix: 'items',
    icon: UtensilsCrossed,
    color: '#16A34A',
    tint: ['#ECFDF3', '#DCFCE7'] as const,
  },
  {
    key: 'promos',
    label: 'Promos',
    captionKey: 'activePromos' as const,
    captionSuffix: 'active',
    icon: Tag,
    color: '#DB2777',
    tint: ['#FDF2F8', '#FCE7F3'] as const,
  },
  {
    key: 'partners',
    label: 'Partners',
    captionKey: null,
    captionSuffix: 'Manage',
    icon: Handshake,
    color: '#0891B2',
    tint: ['#ECFEFF', '#CFFAFE'] as const,
  },
] as const;

export function QuickActionsGrid({ actions, onOrdersPress, onMenuPress }: Props) {
  const handlers: Record<string, (() => void) | undefined> = {
    orders: onOrdersPress,
    menu: onMenuPress,
    promos: () => Alert.alert('Promos', 'Offer management is coming soon.'),
    partners: () => Alert.alert('Partners', 'Partner management is coming soon.'),
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.accentBar} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Quick Actions</Text>
          <Text style={styles.subtitle}>Run the floor faster</Text>
        </View>
        <Pressable style={styles.viewAll}>
          <Text style={styles.viewAllText}>VIEW ALL</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {CARDS.map((card) => {
          const Icon = card.icon;
          const caption =
            card.captionKey === null
              ? card.captionSuffix
              : `${actions[card.captionKey]} ${card.captionSuffix}`;

          return (
            <Pressable
              key={card.key}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={handlers[card.key]}
            >
              <View style={[styles.cardWash, { backgroundColor: card.tint[0] }]} />
              <View style={[styles.iconWrap, { backgroundColor: `${card.color}20` }]}>
                <Icon color={card.color} size={20} />
              </View>
              <Text style={styles.label}>{card.label}</Text>
              <Text style={styles.caption}>{caption}</Text>
              {card.key === 'orders' && actions.activeOrders > 0 ? (
                <View style={styles.liveDot} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  accentBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: authTheme.brand,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: authTheme.text,
    fontSize: 19,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 1,
  },
  viewAll: {
    backgroundColor: authTheme.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.08)',
  },
  viewAllText: {
    color: authTheme.brand,
    fontSize: 11,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: authTheme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardWash: {
    position: 'absolute',
    right: -20,
    bottom: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    color: authTheme.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  caption: {
    color: authTheme.textMuted,
    fontSize: 11,
    marginTop: 3,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  liveDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: authTheme.brand,
  },
});
