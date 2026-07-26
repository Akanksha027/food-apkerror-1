import React from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { executeReplaceCart } from '@/lib/order/add-to-cart';
import { useCartStore } from '@/store/cart-store';

export function ReplaceCartModal() {
  const prompt = useCartStore((s) => s.replaceCartPrompt);
  const clearPrompt = useCartStore((s) => s.clearReplaceCartPrompt);
  const insets = useSafeAreaInsets();

  if (!prompt) return null;

  const handleReplace = async () => {
    const p = prompt;
    clearPrompt();
    await executeReplaceCart(p.item, p.restaurant, p.options);
  };

  const handleKeep = () => {
    clearPrompt();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={handleKeep}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleKeep} />
        
        <Animated.View
          entering={SlideInDown.duration(250).springify()}
          exiting={SlideOutDown.duration(200)}
          style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Replace cart?</Text>
            <Text style={styles.message}>
              Your cart has items from another restaurant. Clear it and add from{' '}
              <Text style={styles.restaurantName}>{prompt.restaurant.name}</Text>?
            </Text>
            
            <View style={styles.actionRow}>
              <Pressable style={styles.btnOutline} onPress={handleKeep}>
                <Text style={styles.btnOutlineText}>KEEP CURRENT</Text>
              </Pressable>
              
              <Pressable style={styles.btnSolid} onPress={handleReplace}>
                <Text style={styles.btnSolidText}>REPLACE</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  content: {
    gap: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: authTheme.text,
    letterSpacing: -0.4,
  },
  message: {
    fontFamily: fonts.ui,
    fontSize: 16,
    color: authTheme.textMuted,
    lineHeight: 22,
  },
  restaurantName: {
    fontFamily: fonts.uiMedium,
    color: authTheme.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  btnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  btnOutlineText: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: authTheme.brand,
    letterSpacing: 0.5,
  },
  btnSolid: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.brand,
  },
  btnSolidText: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
