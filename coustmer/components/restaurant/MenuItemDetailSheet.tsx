import { Pressable } from '@/components/common/Pressable';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, HelpCircle, Minus, Plus, Share2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert,
  Modal,
  Platform,
  
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { VegBadge } from '@/components/restaurant/MenuBadges';
import { authTheme } from '@/constants/auth-theme';
import { addMenuItemToCart } from '@/lib/order/add-to-cart';
import { getMenuItemRating } from '@/lib/restaurant/menu-rating';
import { MenuItem } from '@/lib/restaurant/types';
import { playHapticFeedback } from '@/lib/utils/haptics';
import { useCartStore } from '@/store/cart-store';

function caloriesFor(item: MenuItem): string | null {
  const raw = item.calories ?? item.calorie ?? item.cal;
  if (typeof raw === 'number' && raw > 0) return `${Math.round(raw)}Cal.`;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.toLowerCase().includes('cal') ? raw : `${raw}Cal.`;
  }
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const calTag = tags.find((t) => String(t).startsWith('cal:'));
  if (calTag) {
    const n = String(calTag).split(':')[1];
    if (n) return `${n}Cal.`;
  }
  return null;
}

function likedBadge(item: MenuItem, rating: number | null): string | null {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  if (tags.some((t) => /most.?liked|bestseller|popular/i.test(String(t)))) {
    return '#1 Most liked';
  }
  if (rating != null && rating >= 4.5) return '#1 Most liked';
  if (item.categoryName?.toLowerCase().includes('recommend')) {
    return 'Recommended';
  }
  return rating != null ? `★ ${rating.toFixed(1)} rated` : null;
}

type MenuItemDetailSheetProps = {
  item: MenuItem | null;
  restaurantId: string;
  restaurantName: string;
  restaurantImageUrl?: string;
  visible: boolean;
  onClose: () => void;
};

export function MenuItemDetailSheet({
  item,
  restaurantId,
  restaurantName,
  restaurantImageUrl,
  visible,
  onClose,
}: MenuItemDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const cartQuantity = useCartStore(
    (s) =>
      s.items.find((i) => i.id === item?.id || i.menuItemId === item?.id)
        ?.quantity || 0
  );
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);

  const rating = item ? getMenuItemRating(item) : null;
  const badge = item ? likedBadge(item, rating) : null;
  const cal = item ? caloriesFor(item) : null;

  const unitPrice = item?.price ?? 0;

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `Check out ${item.name} at ${restaurantName}!`,
      });
    } catch {
      // dismissed
    }
  };

  const handleAdd = () => {
    if (!item || item.isAvailable === false) return;
    playHapticFeedback();

    const cartItem: MenuItem = {
      ...item,
      price: unitPrice,
      specialInstructions: item.specialInstructions,
    };

    addMenuItemToCart(cartItem, {
      id: restaurantId,
      name: restaurantName,
      imageUrl: restaurantImageUrl,
    });
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Floating Close Button */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X color="#FFFFFF" size={24} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header Image */}
            <View style={styles.hero}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.heroImage}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.heroImage} />
              )}
            </View>
            {/* Out of Stock overlay on hero image */}
            {item.isAvailable === false && (
              <View style={styles.outOfStockOverlay}>
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              </View>
            )}

            {/* Content Body */}
            <View style={styles.body}>
              {badge ? (
                <View style={styles.likedPill}>
                  <Text style={styles.likedText}>{badge}</Text>
                </View>
              ) : null}

              <View style={styles.titleRow}>
                <VegBadge isVeg={item.isVeg} />
                <Text style={styles.name}>{item.name}</Text>
              </View>

              {cal ? <Text style={styles.calories}>{cal}</Text> : null}

              <Text style={styles.price}>₹{item.price.toFixed(0)}</Text>

              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}

              {item.isAvailable === false ? (
                <View style={styles.unavailableRow}>
                  <Text style={styles.unavailableText}>⚠️ Currently unavailable</Text>
                  <Text style={styles.unavailableHint}>This item is temporarily out of stock and cannot be ordered right now.</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Footer actions */}
          {item.isAvailable !== false ? (
            cartQuantity > 0 ? (
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                  <View style={[styles.qtyWrap, { flex: 1, justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: authTheme.brand }]}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => {
                        playHapticFeedback();
                        decrement(item.id);
                        if (cartQuantity === 1) onClose();
                      }}
                      hitSlop={8}
                    >
                      <Minus color={authTheme.brand} size={20} strokeWidth={2.6} />
                    </Pressable>
                    <Text style={[styles.qtyValue, { color: authTheme.brand, fontSize: 18 }]}>{cartQuantity}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => {
                        playHapticFeedback();
                        increment(item.id);
                      }}
                      hitSlop={8}
                    >
                      <Plus color={authTheme.brand} size={20} strokeWidth={2.6} />
                    </Pressable>
                  </View>
                  <Pressable
                    style={[styles.addBtn, { flex: 1, backgroundColor: '#111827' }]}
                    onPress={() => {
                      onClose();
                      router.push('/cart');
                    }}
                  >
                    <Text style={styles.addBtnText}>View Cart</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>
                    ₹{unitPrice.toFixed(0)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Item Total</Text>
                </View>
                <Pressable style={[styles.addBtn, { flex: 1.5 }]} onPress={handleAdd}>
                  <Text style={styles.addBtnText}>ADD ITEM</Text>
                </Pressable>
              </View>
            )
          ) : (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={[styles.addBtn, styles.addBtnDisabled, { flex: 1 }]}>
                <Text style={[styles.addBtnText, { color: '#9CA3AF' }]}>OUT OF STOCK</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  hero: {
    height: 260,
    backgroundColor: '#F3F4F6',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  likedPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  likedText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  calories: {
    marginTop: 6,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  price: {
    marginTop: 8,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  unavailable: {
    marginTop: 10,
    color: authTheme.error,
    fontWeight: '700',
    fontSize: 14,
  },
  addonsHeader: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  addonsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  addonsHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  optionalPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  addonList: {
    marginTop: 8,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOn: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  addonName: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  addonPrice: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 8,
    height: 48,
  },
  qtyBtn: {
    padding: 10,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    width: 28,
    textAlign: 'center',
  },
  addBtn: {
    flex: 1,
    backgroundColor: authTheme.brand,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  addBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  outOfStockOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 260,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  unavailableRow: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  unavailableText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  unavailableHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#991B1B',
    lineHeight: 17,
  },
});
