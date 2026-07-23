import * as Location from 'expo-location';
import { Crosshair, MapPin, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { addressApi, type AddressSuggestion } from '@/lib/address/api';
import { getApiErrorMessage } from '@/lib/errors';

const DEFAULT = { lat: 12.9716, lng: 77.5946 };

export type MapPickResult = {
  lat: number;
  lng: number;
  formattedAddress?: string;
};

type LocationMapPickerProps = {
  visible: boolean;
  initial?: { lat: number; lng: number } | null;
  onClose: () => void;
  onConfirm: (result: MapPickResult) => void;
};

function buildMapHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e5e7eb; }
  .center-pin {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%, -100%);
    z-index: 1000; pointer-events: none;
  }
  .center-pin svg { filter: drop-shadow(0 3px 4px rgba(0,0,0,0.3)); }
</style>
</head>
<body>
<div id="map"></div>
<div class="center-pin">
  <svg width="42" height="42" viewBox="0 0 24 24" fill="#9E1B32" stroke="#9E1B32" stroke-width="1.5">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
    <circle cx="12" cy="10" r="3" fill="#fff" stroke="#fff"></circle>
  </svg>
</div>
<script>
  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([${lat}, ${lng}], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }

  function emitCenter() {
    var c = map.getCenter();
    post({ type: 'move', lat: c.lat, lng: c.lng });
  }

  map.on('moveend', emitCenter);

  document.addEventListener('message', handleRN);
  window.addEventListener('message', handleRN);
  function handleRN(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'setView') {
        map.setView([msg.lat, msg.lng], msg.zoom || 16, { animate: true });
      }
    } catch (err) {}
  }

  post({ type: 'ready' });
  emitCenter();
</script>
</body>
</html>`;
}

export function LocationMapPicker({
  visible,
  initial,
  onClose,
  onConfirm,
}: LocationMapPickerProps) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmPending = useRef(false);

  const startPoint = useMemo(() => initial ?? DEFAULT, [initial]);

  const [pin, setPin] = useState(startPoint);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const sendToMap = useCallback((lat: number, lng: number) => {
    webRef.current?.postMessage(
      JSON.stringify({ type: 'setView', lat, lng, zoom: 16 })
    );
  }, []);

  const reverseLookup = useCallback((lat: number, lng: number) => {
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      const addr = await addressApi.reverseGeocode({ lat, lng });
      if (addr) setDetectedAddress(addr);
    }, 600);
  }, []);

  const detectCurrentLocation = useCallback(async () => {
    setLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Drag the map or search instead.');
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError('Turn on device location (GPS) to auto-detect your position.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = pos.coords;
      setPin({ lat: latitude, lng: longitude });
      sendToMap(latitude, longitude);

      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (place) {
          const parts = [place.name, place.street, place.city, place.region]
            .filter(Boolean)
            .filter((v, i, arr) => arr.indexOf(v) === i);
          setDetectedAddress(parts.join(', ') || 'Current location detected');
        } else {
          setDetectedAddress('Current location detected');
        }
      } catch {
        setDetectedAddress('Current location detected');
      }
    } catch {
      setError('Could not detect your location. Drag the map or search instead.');
    } finally {
      setLocating(false);
    }
  }, [sendToMap]);

  useEffect(() => {
    if (!visible) {
      setMapReady(false);
      return;
    }
    setError(null);
    setSearchError(null);
    setSuggestions([]);
    setSearch('');
    setPin(startPoint);
    setDetectedAddress(undefined);
  }, [visible, startPoint]);

  useEffect(() => {
    if (!mapReady) return;
    if (initial) {
      sendToMap(initial.lat, initial.lng);
    } else {
      void detectCurrentLocation();
    }
  }, [mapReady, initial, sendToMap, detectCurrentLocation]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
    };
  }, []);

  const onMapMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        setMapReady(true);
      } else if (msg.type === 'move' && typeof msg.lat === 'number') {
        setPin({ lat: msg.lat, lng: msg.lng });
        setDetectedAddress(undefined);
        reverseLookup(msg.lat, msg.lng);
      } else if (
        msg.type === 'confirm' &&
        confirmPending.current &&
        typeof msg.lat === 'number' &&
        typeof msg.lng === 'number'
      ) {
        confirmPending.current = false;
        onConfirm({
          lat: msg.lat,
          lng: msg.lng,
          formattedAddress: detectedAddress,
        });
      }
    } catch {
      // ignore
    }
  };

  const onSearchChange = (text: string) => {
    setSearch(text);
    setSearchError(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await addressApi.autocomplete(text.trim());
        setSuggestions(res);
        if (res.length === 0) {
          setSearchError('No places found. Try a more specific address.');
        }
      } catch (err) {
        setSuggestions([]);
        setSearchError(getApiErrorMessage(err, 'Could not load address suggestions'));
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const pickSuggestion = async (item: AddressSuggestion) => {
    Keyboard.dismiss();
    setSuggestions([]);
    setSearch(item.description);
    setSearching(true);
    setSearchError(null);
    setError(null);
    try {
      const geo = await addressApi.geocode({
        placeId: item.placeId,
        address: item.description,
      });
      setPin({ lat: geo.lat, lng: geo.lng });
      sendToMap(geo.lat, geo.lng);
      setDetectedAddress(geo.formattedAddress ?? item.description);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to locate this place'));
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    confirmPending.current = true;
    webRef.current?.injectJavaScript(`
      (function() {
        var c = map.getCenter();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'confirm',
          lat: c.lat,
          lng: c.lng
        }));
      })();
      true;
    `);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {visible ? (
          <WebView
            ref={webRef}
            style={styles.map}
            originWhitelist={['*']}
            source={{ html: buildMapHtml(startPoint.lat, startPoint.lng) }}
            onMessage={onMapMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={theme.primary} size="large" />
                <Text style={styles.mapLoadingText}>Loading map…</Text>
              </View>
            )}
          />
        ) : null}

        <View
          style={[styles.topSection, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.topBar}>
            <View style={styles.searchWrap}>
              <Search color={theme.muted} size={18} />
              <TextInput
                value={search}
                onChangeText={onSearchChange}
                placeholder="Search location on map…"
                placeholderTextColor={theme.muted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {searching ? <ActivityIndicator color={theme.primary} size="small" /> : null}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <X color={theme.secondary} size={20} />
            </Pressable>
          </View>

          {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}

          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {suggestions.slice(0, 6).map((s, index) => (
                <Pressable
                  key={`${s.placeId ?? s.description}-${index}`}
                  onPress={() => pickSuggestion(s)}
                  style={[
                    styles.suggestionRow,
                    index === suggestions.length - 1 && styles.suggestionRowLast,
                  ]}
                >
                  <MapPin color={theme.primary} size={16} />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {s.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}
          pointerEvents="box-none"
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.detectedRow}>
            <MapPin color={theme.primary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detectedLabel}>SELECTED LOCATION</Text>
              <Text style={styles.detectedValue} numberOfLines={2}>
                {detectedAddress ??
                  `Lat ${pin.lat.toFixed(5)}, Lng ${pin.lng.toFixed(5)}`}
              </Text>
              <Text style={styles.detectedHint}>Drag the map to move the pin</Text>
            </View>
            <Pressable
              onPress={detectCurrentLocation}
              disabled={locating}
              style={styles.gpsBtn}
            >
              {locating ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <Crosshair color={theme.primary} size={20} />
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && styles.confirmBtnPressed,
            ]}
          >
            <Text style={styles.confirmBtnText}>Confirm This Location</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E5E7EB' },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#E5E7EB',
  },
  mapLoadingText: { fontSize: 14, color: theme.secondaryLight, fontWeight: '600' },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.secondary },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchError: {
    marginTop: 8,
    marginHorizontal: 16,
    fontSize: 13,
    color: theme.danger,
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
  },
  suggestions: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 280,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  suggestionText: { flex: 1, fontSize: 14, color: theme.secondary },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 24,
    zIndex: 30,
  },
  detectedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detectedLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.secondaryLight,
  },
  detectedValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: theme.secondary,
  },
  detectedHint: { marginTop: 2, fontSize: 12, color: theme.muted },
  gpsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { fontSize: 13, color: theme.danger, fontWeight: '500' },
  confirmBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#6E0F1B',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  confirmBtnPressed: {
    opacity: 0.9,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
