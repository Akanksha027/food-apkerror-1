import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { EmptyView, ErrorView, LoadingView } from '@/components/common/StateViews';
import { ProfileFormLayout } from '@/components/profile/ProfileFormLayout';
import { authTheme } from '@/constants/auth-theme';
import {
  useAddWalletMoney,
  useWallet,
  useWalletTransactions,
} from '@/lib/profile/hooks';

export function WalletScreen() {
  const wallet = useWallet();
  const transactions = useWalletTransactions();
  const addMoney = useAddWalletMoney();

  const [amount, setAmount] = useState('');
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const handleAddMoney = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setBanner({ message: 'Enter a valid amount', type: 'error' });
      return;
    }

    setBanner(null);
    addMoney.mutate(
      { amount: value },
      {
        onSuccess: (data) => {
          setAmount('');
          setBanner({
            message: `Added ₹${value}. New balance: ₹${data.balance}`,
            type: 'success',
          });
        },
        onError: (error) =>
          setBanner({
            message: error instanceof Error ? error.message : 'Failed to add money',
            type: 'error',
          }),
      }
    );
  };

  return (
    <ProfileFormLayout
      title="Wallet"
      subtitle="Balance & transactions"
      banner={banner}
    >
      {wallet.isLoading ? (
        <LoadingView label="Loading wallet…" />
      ) : wallet.isError ? (
        <ErrorView
          message={
            wallet.error instanceof Error ? wallet.error.message : 'Failed to load'
          }
          onRetry={wallet.refetch}
        />
      ) : (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>
            ₹{wallet.data?.balance.toFixed(0) ?? 0}
          </Text>
          <Text style={styles.balanceMeta}>
            {wallet.data?.currency ?? 'INR'}
            {wallet.data?.isLocked ? ' · Locked' : ''}
          </Text>
        </View>
      )}

      <AuthInput
        label="Add money (₹)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="500"
      />

      <Pressable
        style={styles.addButton}
        onPress={handleAddMoney}
        disabled={addMoney.isPending}
      >
        {addMoney.isPending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.addButtonText}>Add money</Text>
        )}
      </Pressable>

      <Text style={styles.sectionTitle}>Recent transactions</Text>
      {transactions.isLoading ? (
        <ActivityIndicator color={authTheme.brand} style={{ marginTop: 20 }} />
      ) : transactions.isError ? (
        <ErrorView
          message={
            transactions.error instanceof Error
              ? transactions.error.message
              : 'Failed to load transactions'
          }
          onRetry={transactions.refetch}
        />
      ) : !transactions.data?.data.length ? (
        <EmptyView
          title="No transactions yet"
          subtitle="Your wallet activity will appear here."
        />
      ) : (
        <FlatList
          data={transactions.data.data}
          scrollEnabled={false}
          keyExtractor={(item, index) => String(item.id ?? index)}
          contentContainerStyle={styles.txList}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View>
                <Text style={styles.txTitle}>
                  {item.description ?? item.type ?? 'Transaction'}
                </Text>
                {item.createdAt ? (
                  <Text style={styles.txDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
              {typeof item.amount === 'number' ? (
                <Text style={styles.txAmount}>₹{item.amount}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </ProfileFormLayout>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: authTheme.brand,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 6,
  },
  balanceMeta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 4,
  },
  addButton: {
    marginTop: 16,
    backgroundColor: authTheme.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
  },
  txList: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: authTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
  },
  txTitle: {
    color: authTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    color: authTheme.brand,
    fontSize: 15,
    fontWeight: '800',
  },
});
