import { useRouter } from 'expo-router';
import { Bookmark, RotateCcw, Trash2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import {
  useDeleteSavedCart,
  useRestoreSavedCart,
  useSavedCarts,
} from '@/lib/cart/hooks';
import type { SavedCart } from '@/lib/cart/types';
import { useAuthStore } from '@/store/auth-store';

export function SavedCartsScreen() {
  const router = useRouter();
  const isLoggedIn = Boolean(useAuthStore((s) => s.token));
  const saved = useSavedCarts(isLoggedIn);
  const restore = useRestoreSavedCart();
  const remove = useDeleteSavedCart();

  const handleRestore = (cart: SavedCart) => {
    Alert.alert(
      'Restore cart?',
      'This will replace your current active cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await restore.mutateAsync(cart.id);
              router.replace('/cart');
            } catch (e) {
              Alert.alert(
                'Restore failed',
                e instanceof Error ? e.message : 'Could not restore cart'
              );
            }
          },
        },
      ]
    );
  };

  const handleDelete = (cart: SavedCart) => {
    Alert.alert('Delete saved cart?', cart.name || 'This saved cart', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(cart.id);
          } catch (e) {
            Alert.alert(
              'Delete failed',
              e instanceof Error ? e.message : 'Could not delete'
            );
          }
        },
      },
    ]);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pad}>
          <ScreenHeader title="Saved carts" />
          <EmptyView
            title="Sign in to view saved carts"
            subtitle="Save carts while logged in to restore them later."
          />
          <Pressable
            style={styles.loginBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title="Saved carts"
          subtitle="Restore favourites anytime"
        />
      </View>

      {saved.isLoading ? (
        <LoadingView label="Loading saved carts…" />
      ) : saved.isError ? (
        <ErrorView
          message={
            saved.error instanceof Error
              ? saved.error.message
              : 'Failed to load saved carts'
          }
          onRetry={saved.refetch}
        />
      ) : (
        <FlatList
          data={saved.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={saved.isRefetching}
              onRefresh={saved.refetch}
              tintColor={authTheme.brand}
            />
          }
          ListEmptyComponent={
            <EmptyView
              title="No saved carts"
              subtitle="From your cart, tap “Save cart for later”."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.icon}>
                <Bookmark color={authTheme.brand} size={18} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>
                  {item.name || item.restaurantName || 'Saved cart'}
                </Text>
                <Text style={styles.meta}>
                  {item.itemCount ?? item.items?.length ?? 0} items
                  {typeof item.subtotal === 'number'
                    ? ` · ₹${item.subtotal.toFixed(0)}`
                    : ''}
                </Text>
                {item.createdAt ? (
                  <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                ) : null}
              </View>
              <Pressable
                style={styles.action}
                onPress={() => handleRestore(item)}
                disabled={restore.isPending}
              >
                {restore.isPending ? (
                  <ActivityIndicator color={authTheme.brand} size="small" />
                ) : (
                  <RotateCcw color={authTheme.brand} size={18} />
                )}
              </Pressable>
              <Pressable
                style={styles.action}
                onPress={() => handleDelete(item)}
                disabled={remove.isPending}
              >
                <Trash2 color="#DC2626" size={18} />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authTheme.bg },
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  list: { padding: 20, gap: 10, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { color: authTheme.text, fontWeight: '800', fontSize: 14 },
  meta: { color: authTheme.textMuted, fontSize: 12, marginTop: 2 },
  date: { color: authTheme.textDim, fontSize: 11, marginTop: 2 },
  action: { padding: 6 },
  loginBtn: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: authTheme.brand,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginText: { color: '#FFFFFF', fontWeight: '800' },
});
