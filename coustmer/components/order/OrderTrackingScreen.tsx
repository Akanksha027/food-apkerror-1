import { Pressable } from '@/components/common/Pressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, MoreHorizontal, MessageCircle, ChevronRight, X, Gift, Home, Edit2, CheckCircle2 } from 'lucide-react-native';
import { ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions } from 'react-native';
import Animated, { useSharedValue, withSpring, withDelay, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { useRef } from 'react';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { OrderStatusTimeline, type OrderStatus } from '@/components/order/OrderStatusTimeline';
import { useOrder, useOrderTracking } from '@/lib/order/hooks';
import { useCartStore } from '@/store/cart-store';
import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';

const generateMapHtml = (coords: { latitude: number, longitude: number }[], restLat: number, restLng: number, custLat: number, custLng: number, restName: string, apiKey: string) => {
  const routeJson = JSON.stringify(coords.map(c => [c.latitude, c.longitude]));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body { padding: 0; margin: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        html, body, #map { height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map, directionsService, directionsRenderer, scooterMarker;
        const routeCoords = ${routeJson};
        const restLat = ${restLat};
        const restLng = ${restLng};
        const custLat = ${custLat};
        const custLng = ${custLng};

        function initMap() {
          // Initialize map centered between restaurant and customer
          const center = {
            lat: (restLat + custLat) / 2,
            lng: (restLng + custLng) / 2
          };

          map = new google.maps.Map(document.getElementById('map'), {
            zoom: 14,
            center: center,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });

          // Directions service for routing
          directionsService = new google.maps.DirectionsService();
          directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#FF6B35',
              strokeOpacity: 0.9,
              strokeWeight: 5,
              geodesic: true
            }
          });

          // Restaurant marker (pot icon)
          const restaurantMarker = new google.maps.Marker({
            position: { lat: restLat, lng: restLng },
            map: map,
            icon: {
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#222222',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 1.5,
              anchor: new google.maps.Point(12, 22)
            },
            label: {
              text: '${restName}',
              color: '#1C1C1C',
              fontSize: '14px',
              fontWeight: 'bold',
              className: 'marker-label'
            }
          });

          // Customer marker (house icon)
          const customerMarker = new google.maps.Marker({
            position: { lat: custLat, lng: custLng },
            map: map,
            icon: {
              path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
              fillColor: '#222222',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 1.5,
              anchor: new google.maps.Point(12, 22)
            },
            label: {
              text: 'House',
              color: '#1C1C1C',
              fontSize: '14px',
              fontWeight: 'bold'
            }
          });

          // Scooter marker for delivery partner
          scooterMarker = new google.maps.Marker({
            position: { lat: restLat, lng: restLng },
            map: map,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><text x="20" y="30" font-size="30" text-anchor="middle">🛵</text></svg>'),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20)
            },
            zIndex: 1000
          });

          // Get directions from restaurant to customer
          const request = {
            origin: { lat: restLat, lng: restLng },
            destination: { lat: custLat, lng: custLng },
            travelMode: google.maps.TravelMode.DRIVING
          };

          directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(result);
              
              // Send distance and duration to React Native
              const route = result.routes[0].legs[0];
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ROUTE_INFO',
                  distance: route.distance.text,
                  duration: route.duration.text
                }));
              }

              // Fit bounds to show entire route with padding
              const bounds = new google.maps.LatLngBounds();
              bounds.extend({ lat: restLat, lng: restLng });
              bounds.extend({ lat: custLat, lng: custLng });
              map.fitBounds(bounds, {
                top: 100,
                bottom: 200,
                left: 50,
                right: 50
              });

              // Add a subtle shadow/outline to the route for better visibility
              const routePath = result.routes[0].overview_path;
              new google.maps.Polyline({
                path: routePath,
                geodesic: true,
                strokeColor: '#000000',
                strokeOpacity: 0.2,
                strokeWeight: 8,
                map: map,
                zIndex: 1
              });

              // Animate scooter along the route
              animateScooter(routePath);
            } else {
              console.error('Directions request failed:', status);
              // Fallback: draw a straight line if directions fail
              const fallbackPath = [
                { lat: restLat, lng: restLng },
                { lat: custLat, lng: custLng }
              ];
              new google.maps.Polyline({
                path: fallbackPath,
                geodesic: true,
                strokeColor: '#FF6B35',
                strokeOpacity: 0.7,
                strokeWeight: 5,
                map: map,
                icons: [{
                  icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3
                  },
                  offset: '0',
                  repeat: '20px'
                }]
              });
            }
          });

          // Listen for zoom changes
          map.addListener('zoom_changed', () => {
            const zoomLevel = map.getZoom();
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ZOOM_CHANGED',
                isZoomed: zoomLevel > 14
              }));
            }
          });
        }

        // Animate scooter marker along the route
        function animateScooter(path) {
          if (!path || path.length === 0) return;
          
          let step = 0;
          const totalSteps = path.length;
          const stepDuration = 200; // ms between steps (faster movement)
          let animationFrameId;

          function moveScooter() {
            if (step < totalSteps) {
              const position = path[step];
              
              // Smooth marker movement
              scooterMarker.setPosition(position);
              
              // Calculate bearing for next step to rotate scooter icon
              if (step < totalSteps - 1) {
                const nextPosition = path[step + 1];
                const bearing = google.maps.geometry.spherical.computeHeading(position, nextPosition);
                
                // Update scooter icon with rotation
                const rotatedIcon = {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" style="transform: rotate(' + bearing + 'deg)"><text x="20" y="30" font-size="30" text-anchor="middle">🛵</text></svg>'
                  ),
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(20, 20)
                };
                scooterMarker.setIcon(rotatedIcon);
              }
              
              // Pan map to follow scooter (optional - comment out if you don't want auto-follow)
              // map.panTo(position);
              
              step++;
              animationFrameId = setTimeout(moveScooter, stepDuration);
            } else {
              // Loop back to start after reaching destination
              step = 0;
              animationFrameId = setTimeout(() => {
                // Reset to restaurant position
                scooterMarker.setPosition({ lat: restLat, lng: restLng });
                // Wait a bit before starting next loop
                setTimeout(moveScooter, 3000);
              }, 2000);
            }
          }

          // Start animation after 1 second
          setTimeout(moveScooter, 1000);
          
          // Return cleanup function
          return () => {
            if (animationFrameId) clearTimeout(animationFrameId);
          };
        }
      </script>
      <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initMap">
      </script>
    </body>
    </html>
  `;
};

export function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId, newOrder } = useLocalSearchParams<{ orderId: string, newOrder?: string }>();
  const id = String(orderId ?? '');

  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const clearCart = useCartStore((s) => s.clearCart);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Get Google Maps API key from environment
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDtqlNuzkFM6Ix8GKcQcV06Dz6j1_FVRjo';

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

  // Route info from Google Maps
  const [distanceInfo, setDistanceInfo] = useState<{ dist: string, time: string } | null>(null);

  useEffect(() => {
    mapHeightPercent.value = withTiming(isZoomed ? 100 : 65, { duration: 500 });
  }, [isZoomed]);

  const animatedMapContainerStyle = useAnimatedStyle(() => ({
    height: `${mapHeightPercent.value}%` as any,
  }));

  // Fallback coordinates
  const restLat = t?.restaurantLat ?? 28.6219;
  const restLng = t?.restaurantLng ?? 77.3879;
  const custLat = t?.customerLat ?? 28.6189;
  const custLng = t?.customerLng ?? 77.3915;

  const routeCoords: { latitude: number, longitude: number }[] = [];

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
          source={{ html: generateMapHtml(routeCoords, restLat, restLng, custLat, custLng, o?.restaurantName || 'Restaurant', googleMapsApiKey) }}
          originWhitelist={['*']}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'ZOOM_CHANGED') {
                setIsZoomed(data.isZoomed);
              } else if (data.type === 'ROUTE_INFO') {
                setDistanceInfo({ dist: data.distance, time: data.duration });
              }
            } catch (e) { }
          }}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
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
              <ChevronRight color="#AC0F45" size={16} />
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
