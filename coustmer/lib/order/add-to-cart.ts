import { Alert } from 'react-native';

import { cartApi } from '@/lib/cart/api';
import { applyServerCartToStore } from '@/lib/cart/sync';
import type { MenuItem } from '@/lib/restaurant/types';
import type { CartItem } from '@/store/cart-store';
import { useCartStore } from '@/store/cart-store';

type RestaurantRef = {
  id: string;
  name: string;
  imageUrl?: string;
};

async function addRemote(
  item: Omit<CartItem, 'quantity'> & { quantity?: number },
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
      specialInstructions:
        typeof item.specialInstructions === 'string'
          ? item.specialInstructions
          : undefined,
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
      specialInstructions:
        typeof item.specialInstructions === 'string'
          ? item.specialInstructions
          : undefined,
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

  store.promptReplaceCart({
    item: {
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      imageUrl: item.imageUrl,
      specialInstructions:
        typeof item.specialInstructions === 'string'
          ? item.specialInstructions
          : undefined,
    },
    restaurant,
    options,
  });
  return false;
}

export async function executeReplaceCart(
  item: Omit<CartItem, 'quantity'> & { quantity?: number },
  restaurant: RestaurantRef,
  options?: { onAdded?: () => void }
) {
  const store = useCartStore.getState();
  try {
    await cartApi.clearCart();
  } catch {
    // ignore
  }
  store.clearCart();
  await addRemote(item, restaurant, options);
}
