import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert,
  FlatList,
  
  RefreshControl,
  StyleSheet,
  Text,
  View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from '@/lib/payment/hooks';
import type { SavedPaymentMethod } from '@/lib/payment/types';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';

export function PaymentMethodsScreen() {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const methods = usePaymentMethods();
  const deleteMethod = useDeletePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();

  const savedMethods = methods.data ?? [];

  const refetch = () => {
    methods.refetch();
  };

  const refreshing = methods.isRefetching;

  const handleDelete = (method: SavedPaymentMethod) => {
    Alert.alert(
      'Delete Payment Method',
      `Remove ${method.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMethod.mutateAsync(method.id);
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete method'
              );
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (method: SavedPaymentMethod) => {
    if (method.isDefault) return;
    
    try {
      await setDefault.mutateAsync(method.id);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to set as default'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title="Payment Methods"
          subtitle="Manage saved cards & UPI"
          left={
            <Pressable
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <ArrowLeft color={authTheme.text} size={20} />
            </Pressable>
          }
          right={
            <Pressable
              style={styles.addBtn}
              onPress={() => setAddModalOpen(true)}
            >
              <Plus color={authTheme.brand} size={18} />
            </Pressable>
          }
        />
      </View>

      {methods.isLoading ? (
        <LoadingView label="Loading methods…" />
      ) : methods.isError ? (
        <ErrorView
          message={
            methods.error instanceof Error
              ? methods.error.message
              : 'Failed to load payment methods'
          }
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={savedMethods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor={authTheme.brand}
            />
          }
          ListHeaderComponent={
            <Pressable
              style={styles.addMethodCard}
              onPress={() => setAddModalOpen(true)}
            >
              <View style={styles.addIcon}>
                <Plus color={authTheme.brand} size={20} />
              </View>
              <Text style={styles.addText}>Add new payment method</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <EmptyView
              title="No saved methods"
              subtitle="Add a card or UPI ID for faster checkout."
            />
          }
          renderItem={({ item }) => (
            <MethodCard
              method={item}
              onDelete={() => handleDelete(item)}
              onSetDefault={() => handleSetDefault(item)}
              isSettingDefault={setDefault.isPending}
            />
          )}
        />
      )}

      <AddPaymentMethodModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </SafeAreaView>
  );
}

function MethodCard({
  method,
  onDelete,
  onSetDefault,
  isSettingDefault,
}: {
  method: SavedPaymentMethod;
  onDelete: () => void;
  onSetDefault: () => void;
  isSettingDefault: boolean;
}) {
  const icon =
    method.type === 'card' ? (
      <CreditCard color={authTheme.brand} size={20} />
    ) : (
      <Wallet color={authTheme.brand} size={20} />
    );

  return (
    <View style={styles.methodCard}>
      <View style={styles.methodIcon}>{icon}</View>
      <View style={styles.methodBody}>
        <Text style={styles.methodTitle}>{method.label}</Text>
        <Text style={styles.methodMeta}>
          {method.type.toUpperCase()}
          {method.isDefault ? ' • Default' : ''}
        </Text>
      </View>
      <View style={styles.methodActions}>
        {!method.isDefault && (
          <Pressable
            style={[styles.actionBtn, styles.defaultBtn]}
            onPress={onSetDefault}
            disabled={isSettingDefault}
          >
            <Check color={authTheme.brand} size={16} />
          </Pressable>
        )}
        <Pressable
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={onDelete}
        >
          <Trash2 color="#E53935" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authTheme.bg },
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.surface,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.brandSoft,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  addMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: authTheme.brandSoft,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: authTheme.brand,
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: authTheme.brand,
    fontWeight: '700',
    fontSize: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: authTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBody: { flex: 1 },
  methodTitle: {
    color: authTheme.text,
    fontWeight: '700',
    fontSize: 16,
  },
  methodMeta: {
    color: authTheme.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBtn: {
    backgroundColor: authTheme.brandSoft,
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
  },
});