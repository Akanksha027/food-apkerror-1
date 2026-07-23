import { CreditCard, Star, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
  useDeletePaymentMethod,
  usePaymentMethods,
  useSavePaymentMethod,
  useSetDefaultPaymentMethod,
} from '@/lib/payment/hooks';
import type { SavedMethodType } from '@/lib/payment/types';

type AddMode = 'upi' | 'card' | null;

export function PaymentMethodsScreen() {
  const methods = usePaymentMethods();
  const saveMethod = useSavePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();

  const [addMode, setAddMode] = useState<AddMode>(null);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [banner, setBanner] = useState<string | null>(null);

  const resetForm = () => {
    setAddMode(null);
    setUpiId('');
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setCardHolderName('');
  };

  const handleSave = async () => {
    try {
      if (addMode === 'upi') {
        const cleaned = upiId.trim().toLowerCase();
        if (!cleaned.includes('@')) {
          setBanner('Enter a valid UPI ID (name@bank)');
          return;
        }
        await saveMethod.mutateAsync({
          type: 'upi' as SavedMethodType,
          upiId: cleaned,
          label: cleaned,
          setAsDefault: !(methods.data?.length),
        });
      } else if (addMode === 'card') {
        const digits = cardNumber.replace(/\s/g, '');
        if (digits.length < 12) {
          setBanner('Enter a valid card number');
          return;
        }
        await saveMethod.mutateAsync({
          type: 'card' as SavedMethodType,
          cardNumber: digits,
          expiryMonth: Number(expiryMonth) || undefined,
          expiryYear: Number(expiryYear) || undefined,
          cvv: cvv || undefined,
          cardHolderName: cardHolderName.trim() || undefined,
          label: `Card ···· ${digits.slice(-4)}`,
          setAsDefault: !(methods.data?.length),
        });
      }
      setBanner('Payment method saved');
      resetForm();
      methods.refetch();
    } catch (e) {
      setBanner(e instanceof Error ? e.message : 'Failed to save method');
    }
  };

  const handleDelete = (methodId: string, label: string) => {
    Alert.alert('Remove method?', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMethod.mutateAsync(methodId);
            setBanner('Method removed');
            methods.refetch();
          } catch (e) {
            Alert.alert(
              'Failed',
              e instanceof Error ? e.message : 'Could not delete'
            );
          }
        },
      },
    ]);
  };

  const handleDefault = async (methodId: string) => {
    try {
      await setDefault.mutateAsync(methodId);
      setBanner('Default payment method updated');
      methods.refetch();
    } catch (e) {
      Alert.alert(
        'Failed',
        e instanceof Error ? e.message : 'Could not set default'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title="Payment methods"
          subtitle="Saved cards & UPI"
        />
      </View>

      {methods.isLoading ? (
        <LoadingView label="Loading methods…" />
      ) : methods.isError ? (
        <ErrorView
          message={
            methods.error instanceof Error
              ? methods.error.message
              : 'Failed to load'
          }
          onRetry={methods.refetch}
        />
      ) : (
        <FlatList
          data={methods.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={methods.isRefetching}
              onRefresh={methods.refetch}
              tintColor={authTheme.brand}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {banner ? <Text style={styles.banner}>{banner}</Text> : null}
              <View style={styles.addRow}>
                <Pressable
                  style={styles.addChip}
                  onPress={() => setAddMode('upi')}
                >
                  <Text style={styles.addChipText}>+ UPI</Text>
                </Pressable>
                <Pressable
                  style={styles.addChip}
                  onPress={() => setAddMode('card')}
                >
                  <Text style={styles.addChipText}>+ Card</Text>
                </Pressable>
              </View>

              {addMode ? (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>
                    Add {addMode === 'upi' ? 'UPI' : 'card'}
                  </Text>
                  {addMode === 'upi' ? (
                    <TextInput
                      style={styles.input}
                      value={upiId}
                      onChangeText={setUpiId}
                      placeholder="yourname@upi"
                      placeholderTextColor={authTheme.textDim}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  ) : (
                    <>
                      <TextInput
                        style={styles.input}
                        value={cardHolderName}
                        onChangeText={setCardHolderName}
                        placeholder="Name on card"
                        placeholderTextColor={authTheme.textDim}
                      />
                      <TextInput
                        style={styles.input}
                        value={cardNumber}
                        onChangeText={(t) =>
                          setCardNumber(t.replace(/[^\d\s]/g, '').slice(0, 19))
                        }
                        placeholder="Card number"
                        placeholderTextColor={authTheme.textDim}
                        keyboardType="number-pad"
                      />
                      <View style={styles.row3}>
                        <TextInput
                          style={[styles.input, styles.flex]}
                          value={expiryMonth}
                          onChangeText={setExpiryMonth}
                          placeholder="MM"
                          placeholderTextColor={authTheme.textDim}
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <TextInput
                          style={[styles.input, styles.flex]}
                          value={expiryYear}
                          onChangeText={setExpiryYear}
                          placeholder="YYYY"
                          placeholderTextColor={authTheme.textDim}
                          keyboardType="number-pad"
                          maxLength={4}
                        />
                        <TextInput
                          style={[styles.input, styles.flex]}
                          value={cvv}
                          onChangeText={setCvv}
                          placeholder="CVV"
                          placeholderTextColor={authTheme.textDim}
                          keyboardType="number-pad"
                          maxLength={4}
                          secureTextEntry
                        />
                      </View>
                    </>
                  )}
                  <View style={styles.formActions}>
                    <Pressable style={styles.cancelBtn} onPress={resetForm}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={styles.saveBtn}
                      onPress={handleSave}
                      disabled={saveMethod.isPending}
                    >
                      {saveMethod.isPending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.saveText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            !addMode ? (
              <EmptyView
                title="No saved methods"
                subtitle="Add UPI or a card for quicker checkout."
              />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <CreditCard color={authTheme.brand} size={18} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.label}</Text>
                <Text style={styles.cardMeta}>
                  {item.type.toUpperCase()}
                  {item.isDefault ? ' · Default' : ''}
                </Text>
              </View>
              {!item.isDefault ? (
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => handleDefault(item.id)}
                  disabled={setDefault.isPending}
                >
                  <Star color={authTheme.textMuted} size={18} />
                </Pressable>
              ) : (
                <Star color={authTheme.brand} size={18} fill={authTheme.brand} />
              )}
              <Pressable
                style={styles.iconBtn}
                onPress={() => handleDelete(item.id, item.label)}
                disabled={deleteMethod.isPending}
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
  headerBlock: { gap: 12, marginBottom: 8 },
  banner: {
    color: authTheme.brand,
    fontWeight: '700',
    backgroundColor: authTheme.brandSoft,
    padding: 12,
    borderRadius: 12,
  },
  addRow: { flexDirection: 'row', gap: 10 },
  addChip: {
    flex: 1,
    backgroundColor: authTheme.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addChipText: { color: '#FFFFFF', fontWeight: '700' },
  form: {
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 10,
  },
  formTitle: { color: authTheme.text, fontWeight: '800', fontSize: 15 },
  input: {
    backgroundColor: authTheme.input,
    borderWidth: 1,
    borderColor: authTheme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: authTheme.text,
  },
  row3: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
  },
  cancelText: { color: authTheme.brand, fontWeight: '700' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: authTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: authTheme.text, fontWeight: '700', fontSize: 14 },
  cardMeta: { color: authTheme.textMuted, fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 6 },
});
