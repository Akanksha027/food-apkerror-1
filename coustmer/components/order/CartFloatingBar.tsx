import { Pressable } from '@/components/common/Pressable';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronRight, Check, X } from 'lucide-react-native';
import { StyleSheet, Text, View, Animated, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';

import { useCartStore } from '@/store/cart-store';

type Props = {
  bottomOffset?: number;
};

const WINDOW_WIDTH = Dimensions.get('window').width;
const WINDOW_HEIGHT = Dimensions.get('window').height;

export function CartFloatingBar({ bottomOffset = 0 }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const restaurant = useCartStore((s) => s.restaurant);
  const totalItems = useCartStore((s) => s.totalItems());
  const subtotal = useCartStore((s) => s.subtotal());

  const initialHasItems = items.length > 0 && !!restaurant;

  const slideAnim = useRef(new Animated.Value(initialHasItems ? 0 : 300)).current; 
  
  const leftCannon = useRef<ConfettiCannon>(null);
  const rightCannon = useRef<ConfettiCannon>(null);

  const [isVisible, setIsVisible] = useState(initialHasItems);
  const isVisibleRef = useRef(initialHasItems);

  useEffect(() => {
    const hasItems = items.length > 0 && !!restaurant;
    
    if (hasItems && !isVisibleRef.current) {
      isVisibleRef.current = true;
      setIsVisible(true);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();

      leftCannon.current?.start();
      rightCannon.current?.start();
      
    } else if (!hasItems && isVisibleRef.current) {
      isVisibleRef.current = false;
      
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [items.length, restaurant]);

  if (!isVisible && (!items.length || !restaurant)) {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="box-none">
      
      {/* Confetti full screen overlay */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ConfettiCannon
          ref={leftCannon}
          count={40}
          origin={{ x: -10, y: WINDOW_HEIGHT - 90 }}
          autoStart={false}
          fallSpeed={3000}
          explosionSpeed={350}
          fadeOut={true}
        />
        <ConfettiCannon
          ref={rightCannon}
          count={40}
          origin={{ x: WINDOW_WIDTH + 10, y: WINDOW_HEIGHT - 90 }}
          autoStart={false}
          fallSpeed={3000}
          explosionSpeed={350}
          fadeOut={true}
        />
      </View>

      <Animated.View
        style={[
          styles.bgContainer,
          { 
            position: 'absolute',
            bottom: Math.max(insets.bottom, 16) + bottomOffset,
            left: 16,
            right: 16,
            transform: [{ translateY: slideAnim }]
          },
        ]}
      >
        <View style={styles.cardContent}>
          <Pressable 
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => restaurant && router.push({ pathname: '/restaurants/[id]', params: { id: restaurant.id } })}
          >
            <View style={styles.imageWrap}>
              {restaurant?.imageUrl ? (
                <Image source={{ uri: restaurant.imageUrl }} style={styles.restImage} />
              ) : items[0]?.imageUrl ? (
                <Image source={{ uri: items[0].imageUrl }} style={styles.restImage} />
              ) : (
                <View style={[styles.restImage, { backgroundColor: '#EEEEEE' }]} />
              )}
            </View>
            <View style={styles.textCol}>
              <Text style={styles.restName} numberOfLines={1}>{restaurant?.name || 'Restaurant'}</Text>
              <Text style={styles.viewMenuText}>View full menu</Text>
            </View>
          </Pressable>
          <Pressable style={styles.checkoutBtn} onPress={() => router.push('/cart')}>
            <Text style={styles.checkoutTitle}>Checkout</Text>
            <Text style={styles.checkoutSub}>{totalItems} item{totalItems > 1 ? 's' : ''} | ₹{subtotal}</Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={() => setIsVisible(false)} hitSlop={8}>
            <X color="#999999" size={16} strokeWidth={3} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  imageWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  restImage: {
    width: '100%',
    height: '100%',
  },
  textCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  restName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3E4152',
  },
  viewMenuText: {
    fontSize: 13,
    color: '#93959F',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  checkoutBtn: {
    backgroundColor: '#1BA672',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  checkoutSub: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    marginLeft: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
