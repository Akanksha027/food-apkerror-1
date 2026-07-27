import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, MoreHorizontal, MessageCircle, ChevronRight, X, Gift, Home, Edit2, CheckCircle2 } from 'lucide-react-native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
} from 'react-native';
import Animated, { useSharedValue, withSpring, withDelay, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { useRef } from 'react';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { useOrder, useOrderTracking } from '@/lib/order/hooks';
import { useCartStore } from '@/store/cart-store';
import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';

const generateMapHtml = (coords: { latitude: number, longitude: number }[], restLat: number, restLng: number, custLat: number, custLng: number, restName: string) => {
  const routeJson = JSON.stringify(coords.map(c => [c.latitude, c.longitude]));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        html, body, #map { height: 100%; width: 100%; }
        
        /* Hide Leaflet watermark */
        .leaflet-control-attribution { display: none !important; }

        .custom-marker-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        
        .marker-circle {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          max-width: 44px !important;
          max-height: 44px !important;
          background-color: #222222;
          border-radius: 50% !important;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
        }

        .marker-label {
          background-color: #FFFFFF;
          color: #1C1C1C;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 12px;
          margin-top: 8px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .scooter-marker {
          font-size: 28px;
          filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));
          transform: rotate(-15deg);
          transition: transform 0.5s linear;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        });

        // CartoDB Positron tiles (light and minimal)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);

        const routeCoords = ${routeJson};
        const restLat = ${restLat};
        const restLng = ${restLng};
        const custLat = ${custLat};
        const custLng = ${custLng};

        // Prepare Route and Scooter
        let polyline, scooterMarker;

        if (routeCoords.length > 0) {
          polyline = L.polyline(routeCoords, { color: '#F05A2A', weight: 4 });
          
          const scooterIcon = L.divIcon({
            className: 'scooter-marker',
            html: '🛵',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          // Place scooter at the store (index 0)
          scooterMarker = L.marker(routeCoords[0], {icon: scooterIcon});
        } else {
          // Fallback dotted line
          polyline = L.polyline([[restLat, restLng], [custLat, custLng]], { color: '#F05A2A', weight: 4, dashArray: '1, 8', lineCap: 'round' });
        }

        // Center the map but force a zoomed-out view initially (e.g., zoom level 14)
        const bounds = L.latLngBounds([[restLat, restLng], [custLat, custLng]]);
        map.setView(bounds.getCenter(), 14);
        
        const initialZoom = 14;

        function updateMapElements() {
          const zoomedIn = map.getZoom() > initialZoom;
          if (zoomedIn) {
             if (polyline && !map.hasLayer(polyline)) map.addLayer(polyline);
             if (scooterMarker && !map.hasLayer(scooterMarker)) map.addLayer(scooterMarker);
          } else {
             if (polyline && map.hasLayer(polyline)) map.removeLayer(polyline);
             if (scooterMarker && map.hasLayer(scooterMarker)) map.removeLayer(scooterMarker);
          }
          if (window.ReactNativeWebView) {
             window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ZOOM_CHANGED', isZoomed: zoomedIn }));
          }
        }
        
        map.on('zoomend', updateMapElements);
        updateMapElements();

        // Animate scooter along the route
        // [Disabled for now: keep static at the store]
        /*
        if (routeCoords.length > 0) {
          let step = 0;
          setInterval(() => {
            if (scooterMarker && map.hasLayer(scooterMarker)) {
              step = (step + 1) % routeCoords.length;
              scooterMarker.setLatLng(routeCoords[step]);
            }
          }, 500);
        }
        */

        // SVG Icons
        const potSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M9 4v4"/><path d="M15 4v4"/></svg>';
        const houseSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';

        // Custom Icons
        const restIcon = L.divIcon({
          className: 'custom-marker-wrapper',
          html: \`
            <div class="marker-circle">\${potSvg}</div>
            <div class="marker-label">\${'${restName}'}</div>
          \`,
          iconSize: [100, 60],
          iconAnchor: [50, 32]
        });

        const houseIcon = L.divIcon({
          className: 'custom-marker-wrapper',
          html: \`
            <div class="marker-circle">\${houseSvg}</div>
            <div class="marker-label">House</div>
          \`,
          iconSize: [100, 60],
          iconAnchor: [50, 32]
        });

        L.marker([restLat, restLng], {icon: restIcon}).addTo(map);
        L.marker([custLat, custLng], {icon: houseIcon}).addTo(map);
      </script>
    </body>
    </html>
  `;
};

export function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId, newOrder } = useLocalSearchParams<{ orderId: string, newOrder?: string }>();
  const id = String(orderId ?? '');

  const [showSuccessAnim, setShowSuccessAnim] = useState(false); // Disabled as it's now handled by OrderPlacementModal
  const clearCart = useCartStore((s) => s.clearCart);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (newOrder === 'true') {
      const clearTimer = setTimeout(async () => {
        clearCart();
        try {
          const { cartApi } = await import('@/lib/cart/api');
          await cartApi.clearCart();
        } catch { }
      }, 500);

      return () => clearTimeout(clearTimer);
    }
  }, [newOrder, clearCart]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withTiming(opacity.value === 1 ? 0 : 20, { duration: 400 }) }],
  }));

  const order = useOrder(id);
  const tracking = useOrderTracking(id, { refetchInterval: 8_000 });

  const t = tracking.data;
  const o = order.data;

  // Zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const mapHeightPercent = useSharedValue(65);

  // Scratch card state
  const [showScratchCard, setShowScratchCard] = useState(true);

  useEffect(() => {
    mapHeightPercent.value = withTiming(isZoomed ? 100 : 65, { duration: 500 });
  }, [isZoomed]);

  const animatedMapContainerStyle = useAnimatedStyle(() => ({
    height: `${mapHeightPercent.value}%` as any,
  }));

  // Map state
  const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);
  const [distanceInfo, setDistanceInfo] = useState<{ dist: string, time: string } | null>(null);

  // Fallback coordinates
  const restLat = t?.restaurantLat ?? 28.6219;
  const restLng = t?.restaurantLng ?? 77.3879;
  const custLat = t?.customerLat ?? 28.6189;
  const custLng = t?.customerLng ?? 77.3915;

  useEffect(() => {
    // Fetch OSRM route
    const fetchRoute = async () => {
      try {
        const url = `http://router.project-osrm.org/route/v1/driving/${restLng},${restLat};${custLng},${custLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.routes && json.routes.length > 0) {
          const route = json.routes[0];
          // Extract distance (meters) and duration (seconds)
          const distKm = (route.distance / 1000).toFixed(1);
          const timeMin = Math.ceil(route.duration / 60);
          setDistanceInfo({ dist: `${distKm} km`, time: `${timeMin} mins` });

          // Convert GeoJSON coords [lng, lat] to {latitude, longitude}
          const coords = route.geometry.coordinates.map((c: number[]) => ({
            latitude: c[1],
            longitude: c[0]
          }));

          setRouteCoords(coords);

          // WebView handles auto-fitting via Leaflet's fitBounds
        }
      } catch (e) {
        console.warn('Failed to fetch route:', e);
      }
    };

    fetchRoute();
  }, [restLat, restLng, custLat, custLng]);

  if (tracking.isLoading && !t) {
    return <LoadingView label="Loading tracking…" />;
  }

  if (tracking.isError && !t) {
    return (
      <View style={styles.safe}>
        <View style={styles.pad}>
          <ErrorView
            message={
              tracking.error instanceof Error
                ? tracking.error.message
                : 'Tracking unavailable'
            }
            onRetry={tracking.refetch}
          />
        </View>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Success Animation Overlay */}
      {showSuccessAnim && (
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <Animated.View style={[styles.successIconContainer, iconStyle]}>
              <CheckCircle2 color="#00A160" size={100} strokeWidth={2} />
            </Animated.View>

            <Animated.View style={[styles.successTextContainer, textStyle]}>
              <Text style={styles.successTitle}>Order Placed Successfully!</Text>
              <Text style={styles.successSubtitle}>
                Your delicious food is being prepared and will reach you soon.
              </Text>
            </Animated.View>
          </View>
        </View>
      )}

      {/* Top Half: Map Area */}
      <Animated.View style={[styles.mapContainer, animatedMapContainerStyle]}>
        <WebView
          style={styles.map}
          source={{ html: generateMapHtml(routeCoords, restLat, restLng, custLat, custLng, o?.restaurantName || 'Restaurant') }}
          originWhitelist={['*']}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'ZOOM_CHANGED') {
                setIsZoomed(data.isZoomed);
              }
            } catch (e) { }
          }}
          scrollEnabled={false} // Disable WebView scrolling to avoid interfering with React Native scroll
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />

        {/* Overlay Header */}
        <View style={styles.headerOverlay}>
          <Pressable style={styles.circleBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <ArrowLeft color="#1C1C1C" size={20} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{o?.restaurantName || 'The Waffle Co.'}</Text>
            <Text style={styles.headerSubtitle}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {o?.items?.length || 1} items
            </Text>
          </View>

          <Pressable style={styles.circleBtn}>
            <MoreHorizontal color="#1C1C1C" size={20} />
          </Pressable>
        </View>

        {/* Overlay Order Card */}
        <View style={styles.orderCardWrapper}>
          <View style={styles.orderCard}>
            <View style={styles.orderCardHeader}>
              <View>

                <Text style={styles.orderCardTitle}>Order Placed!</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                  Food is being prepared at the restaurant
                </Text>
              </View>
              <View style={styles.etaBadge}>
                <Text style={styles.etaBadgeNum}>
                  {distanceInfo ? distanceInfo.time.replace(' mins', '') : (t?.etaMinutes || 20)}
                </Text>
                <Text style={styles.etaBadgeText}>mins</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineGraphic}>
                <View style={styles.timelineDotSmall} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineDotSmall} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineRestaurant}>{o?.restaurantName || 'The Waffle Co.'}</Text>
                <View style={styles.timelineAddressRow}>
                  <Edit2 color="#1C1C1C" size={12} style={{ marginTop: 2, marginRight: 6 }} />
                  <Text style={styles.timelineAddress} numberOfLines={2}>
                    To {o?.deliveryAddress?.label || 'House'} {distanceInfo ? `• ${distanceInfo.dist}` : ''} | {o?.deliveryAddress?.formattedAddress || 'Anand dham flats Ashok nagar b block market Ghaziabad'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />
            <Pressable
              style={styles.addressBtn}
              onPress={() => router.push(`/orders/${orderId}`)}
            >
              <Text style={styles.addressBtnText}>Address & instructions</Text>
              <ChevronRight color="#FF5A41" size={16} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Content Scroll */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomScroll}>

        {/* WhatsApp Banner */}
        <View style={styles.whatsappBanner}>
          <View style={styles.waIconBox}>
            <MessageCircle color="#25D366" size={24} />
          </View>
          <View style={styles.waContent}>
            <Text style={styles.waSubText}>Order placed successfully</Text>
            <Text style={styles.waMainText}>You have ordered it and we will deliver it soon</Text>
          </View>
          <ChevronRight color="#888" size={20} />
        </View>

        {/* Ad Banner (Placeholder for Amex) */}
        <View style={styles.adBanner}>
          <View style={styles.adLeft}>
            <Text style={styles.adTitle}>Distinctly yours every day</Text>
            <View style={styles.adDivider} />
            <Text style={styles.adSubtitle}>Benefits worth</Text>
            <Text style={styles.adAmount}>up to ₹80,000</Text>
            <View style={styles.adCardMock}>
              <Text style={styles.adCardMockText}>American Express®</Text>
              <Text style={styles.adCardMockSub}>Platinum Reserve™ Credit Card</Text>
            </View>
          </View>
          <View style={styles.adRight}>
            <View style={styles.adImageMock}>
              <Text style={styles.adImageText}>🛶 Kayaking Image</Text>
            </View>
            <Pressable style={styles.adCloseBtn}>
              <X color="#FFF" size={12} />
            </Pressable>
          </View>
        </View>

        <View style={styles.whileYouWait}>
          <Text style={styles.whileYouWaitText}>WHILE YOU WAIT</Text>
          <View style={styles.whileYouWaitLine} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Scratch Card Popup (Floating) */}
      {showScratchCard && (
        <View style={styles.scratchPopup}>
          <Pressable
            style={{ position: 'absolute', top: -12, right: -12, backgroundColor: '#FFFFFF', padding: 6, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4, zIndex: 10 }}
            onPress={() => setShowScratchCard(false)}
          >
            <X color="#1C1C1C" size={16} />
          </Pressable>
          <View style={styles.scratchCardRed}>
            <Gift color="#FFF" size={32} />
            <Text style={styles.scratchCardText}>--- SCRATCH HERE ---</Text>
          </View>
          <Text style={styles.scratchTitle}>SCRATCH CARD</Text>
          <Text style={styles.scratchSubtitle}>Reveal a reward</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: { flex: 1, backgroundColor: '#FFF' },
  pad: { padding: 20 },
  successOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    marginBottom: 32,
    backgroundColor: '#D1FAE5',
    borderRadius: 100,
    padding: 24,
  },
  successTextContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1C',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  mapContainer: {
    width: '100%',
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  map: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  markerWrapper: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerIcon: {
    fontSize: 16,
  },
  markerLabel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1C1C1C',
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
  },
  orderCardWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  etaBadge: {
    backgroundColor: '#00A160',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  etaBadgeNum: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  etaBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  timelineGraphic: {
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 6,
  },
  timelineDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  timelineLine: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineRestaurant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  timelineAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  timelineAddress: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  addressBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addressBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  bottomScroll: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  whatsappBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  waIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  waContent: {
    flex: 1,
  },
  waSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  waMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1C',
  },
  adBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  adLeft: {
    flex: 1,
    padding: 16,
  },
  adTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  adDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  adSubtitle: {
    fontSize: 14,
    color: '#4B5563',
  },
  adAmount: {
    fontSize: 22,
    fontWeight: '300',
    color: '#1C1C1C',
    marginBottom: 12,
  },
  adCardMock: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  adCardMockText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  adCardMockSub: { color: '#9CA3AF', fontSize: 8, marginTop: 4 },
  adRight: {
    width: '40%',
    backgroundColor: '#93C5FD',
    position: 'relative',
  },
  adImageMock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  adImageText: {
    color: '#1E3A8A',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  adCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whileYouWait: {
    alignItems: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  whileYouWaitText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#1C1C1C',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  whileYouWaitLine: {
    position: 'absolute',
    top: '50%',
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: '#D1D5DB',
    zIndex: 1,
  },
  scratchPopup: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#2A1A1A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  scratchCardRed: {
    backgroundColor: '#DC2626',
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  scratchCardText: {
    color: '#FCA5A5',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 12,
  },
  scratchTitle: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scratchSubtitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
