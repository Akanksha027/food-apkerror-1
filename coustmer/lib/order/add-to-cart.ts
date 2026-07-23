import { Alert } from 'react-native';

import { cartApi } from '@/lib/cart/api';
import { applyServerCartToStore } from '@/lib/cart/sync';
import type { MenuItem } from '@/lib/restaurant/types';
import { useCartStore } from '@/store/cart-store';

type RestaurantRef = {
  id: string;
  name: string;
};

async function addRemote(
  item: MenuItem,
  restaurant: RestaurantRef,
  options?: { onAdded?: () => void }
) {
  const store = useCartStore.getState();
  const local = store.addItem(
    {
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      imageUrl: item.imageUrl,
    },
    restaurant
  );

  if (!local.ok) return local;

  options?.onAdded?.();

  try {
    const cart = await cartApi.addItem({
      menuItemId: item.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      name: item.name,
      price: item.price,
      quantity: 1,
      isVeg: item.isVeg,
      imageUrl: item.imageUrl,
    });
    applyServerCartToStore(cart);
  } catch {
    // Keep optimistic local cart if server is unreachable
  }

  return { ok: true as const };
}

export function addMenuItemToCart(
  item: MenuItem,
  restaurant: RestaurantRef,
  options?: { onAdded?: () => void }
) {
  const store = useCartStore.getState();

  const result = store.addItem(
    {
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      imageUrl: item.imageUrl,
    },
    restaurant
  );

  if (result.ok) {
    options?.onAdded?.();
    void (async () => {
      try {
        const cart = await cartApi.addItem({
          menuItemId: item.id,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          name: item.name,
          price: item.price,
          quantity: 1,
          isVeg: item.isVeg,
          imageUrl: item.imageUrl,
        });
        applyServerCartToStore(cart);
      } catch {
        // optimistic local cart remains
      }
    })();
    return true;
  }

  Alert.alert(
    'Replace cart?',
    `Your cart has items from another restaurant. Clear it and add from ${restaurant.name}?`,
    [
      { text: 'Keep current', style: 'cancel' },
      {
        text: 'Replace',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await cartApi.clearCart();
            } catch {
              // ignore
            }
            store.clearCart();
            await addRemote(item, restaurant, options);
          })();
        },
      },
    ]
  );
  return false;
}
