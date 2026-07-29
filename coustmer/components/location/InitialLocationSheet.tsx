import { Pressable } from '@/components/common/Pressable';
import * as Location from 'expo-location';
import { Crosshair, Home, Search } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/constants/typography';
import { useSavedAddresses } from '@/lib/address/hooks';
import { reverseGeocodeAddress } from '@/lib/address/search';
import { normalizeLat, normalizeLng, shortAddressLabel } from '@/lib/location/format';
import { useDeliveryLocationStore } from '@/store/delivery-location-store';

export type InitialLocationSheetProps = {
  visible: boolean;
  onManual: () => void;
  onClose: () => void;
};

export function InitialLocationSheet({ visible, onManual, onClose }: InitialLocationSheetProps) {
  const insets = useSafeAreaInsets();
  const { data: savedAddresses } = useSavedAddresses({ enabled: visible });
  const setLocation = useDeliveryLocationStore((s) => s.setLocation);
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use your current position.');
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert('Location Disabled', 'Turn on GPS / device location, then try again.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = pos.coords;
      const lat = normalizeLat(latitude);
      const lng = normalizeLng(longitude);

      let address = (await reverseGeocodeAddress({ lat, lng })) ?? undefined;
      if (!address) {
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (place) {
            const parts = [place.name, place.street, place.city, place.region]
              .filter(Boolean)
              .filter((v, i, arr) => arr.indexOf(v) === i);
            address = parts.join(', ');
          }
        } catch { }
      }

      setLocation({
        lat,
        lng,
        formattedAddress: address || 'Current Location',
        label: shortAddressLabel(address || 'Current Location', 'gps'),
        source: 'gps',
        updatedAt: Date.now(),
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Could not detect your location. Try entering manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSaved = (saved: any) => {
    setLocation({
      lat: saved.lat,
      lng: saved.lng,
      formattedAddress: saved.formattedAddress,
      city: saved.city,
      label: saved.label || 'Saved Location',
      source: 'saved',
      savedAddressId: saved.id,
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={() => { }}
    >
      <View style={styles.overlay}>

        {/* Blue Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Crosshair color="#FFFFFF" size={24} />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Location Permission is Off</Text>
            <Text style={styles.bannerSub}>
              Granting location permission will ensure accurate address and hassle free delivery
            </Text>
          </View>
          <Pressable style={styles.grantBtn} onPress={handleGrant} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#5180E2" size="small" />
            ) : (
              <Text style={styles.grantText}>GRANT</Text>
            )}
          </Pressable>
        </View>

        {/* Bottom Sheet */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Text style={styles.sheetTitle}>Select Delivery Address</Text>

          <ScrollView style={styles.scrollArea}>
            {savedAddresses && savedAddresses.length > 0 ? (
              savedAddresses.map((addr) => (
                <Pressable
                  key={addr.id}
                  style={styles.savedRow}
                  onPress={() => handleSelectSaved(addr)}
                >
                  <Home color="#AC0F45" size={20} />
                  <View style={styles.savedTextCol}>
                    <Text style={styles.savedLabel}>{addr.label || 'Saved Address'}</Text>
                    <Text style={styles.savedAddress} numberOfLines={1}>
                      {addr.formattedAddress}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : null}
          </ScrollView>

          <View style={styles.manualWrapper}>
            <Pressable style={styles.manualBtn} onPress={onManual}>
              <Search color="#AC0F45" size={18} />
              <Text style={styles.manualText}>Enter Location Manually</Text>
            </Pressable>
          </View>
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
  banner: {
    backgroundColor: '#6193E6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bannerIconWrap: {
    marginRight: 12,
  },
  bannerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSub: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  grantBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grantText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#5180E2',
    letterSpacing: 0.5,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
  },
  sheetTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: '#3E4152',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
  },
  scrollArea: {
    maxHeight: 300,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
  },
  savedTextCol: {
    marginLeft: 16,
    flex: 1,
  },
  savedLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: '#3E4152',
    marginBottom: 4,
  },
  savedAddress: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: '#93959F',
  },
  manualWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualText: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: '#93959F',
    marginLeft: 12,
  },
});
