import { MapPin, Plus, Star } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { useSavedAddresses } from '@/lib/address/hooks';
import type { SavedAddress } from '@/lib/address/types';
import { formatAddressLabel } from '@/lib/address/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectSaved: (address: SavedAddress) => void;
  onChooseOnMap: () => void;
  onAddNew: () => void;
  activeAddressId?: string | null;
};

export function AddressPickerSheet({
  visible,
  onClose,
  onSelectSaved,
  onChooseOnMap,
  onAddNew,
  activeAddressId,
}: Props) {
  const insets = useSafeAreaInsets();
  const list = useSavedAddresses({ enabled: visible });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Deliver to</Text>
        <Text style={styles.subtitle}>Choose a saved address or pick on map</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {list.isLoading ? (
            <ActivityIndicator color={authTheme.brand} style={{ marginVertical: 24 }} />
          ) : (
            (list.data ?? []).map((address) => {
              const active = activeAddressId === address.id;
              return (
                <Pressable
                  key={address.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => onSelectSaved(address)}
                >
                  <View style={styles.icon}>
                    <MapPin color={authTheme.brand} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowLabel}>
                        {formatAddressLabel(address.label)}
                      </Text>
                      {address.isDefault ? (
                        <View style={styles.defaultPill}>
                          <Star color="#FFFFFF" fill="#FFFFFF" size={9} />
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.rowAddress} numberOfLines={2}>
                      {address.formattedAddress}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}

          {!list.isLoading && !(list.data?.length) ? (
            <Text style={styles.empty}>No saved addresses yet</Text>
          ) : null}
        </ScrollView>

        <Pressable style={styles.secondaryBtn} onPress={onChooseOnMap}>
          <MapPin color={authTheme.brand} size={16} />
          <Text style={styles.secondaryText}>Choose on map</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onAddNew}>
          <Plus color="#FFFFFF" size={16} />
          <Text style={styles.primaryText}>Add new address</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '72%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  title: {
    color: authTheme.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  scroll: { maxHeight: 320 },
  scrollContent: { gap: 8, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    backgroundColor: authTheme.card,
  },
  rowActive: {
    borderColor: authTheme.brand,
    backgroundColor: authTheme.brandSoft,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    color: authTheme.text,
    fontWeight: '800',
    fontSize: 14,
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  rowAddress: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  empty: {
    textAlign: 'center',
    color: authTheme.textDim,
    paddingVertical: 20,
  },
  secondaryBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.brandMuted,
    paddingVertical: 13,
    backgroundColor: authTheme.brandSoft,
  },
  secondaryText: {
    color: authTheme.brand,
    fontWeight: '800',
    fontSize: 14,
  },
  primaryBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: authTheme.brand,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
