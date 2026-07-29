import { Check, CheckCircle2, Clock, Package, Truck, X } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { authTheme } from '@/constants/auth-theme';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

type TimelineStep = {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
  timestamp?: string;
};

type Props = {
  currentStatus: OrderStatus;
  timestamps?: Record<string, string | undefined>;
};

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out-for-delivery',
  'delivered',
];

export function OrderStatusTimeline({ currentStatus, timestamps = {} }: Props) {
  const steps: TimelineStep[] = [
    {
      status: 'pending',
      label: 'Order Placed',
      icon: <Clock color="#FFFFFF" size={16} />,
      timestamp: timestamps.pending || timestamps.createdAt,
    },
    {
      status: 'accepted',
      label: 'Order Accepted',
      icon: <Check color="#FFFFFF" size={16} />,
      timestamp: timestamps.accepted || timestamps.acceptedAt,
    },
    {
      status: 'preparing',
      label: 'Being Prepared',
      icon: <Package color="#FFFFFF" size={16} />,
      timestamp: timestamps.preparing || timestamps.preparingAt,
    },
    {
      status: 'ready',
      label: 'Ready for Pickup',
      icon: <CheckCircle2 color="#FFFFFF" size={16} />,
      timestamp: timestamps.ready || timestamps.readyAt,
    },
    {
      status: 'out-for-delivery',
      label: 'Out for Delivery',
      icon: <Truck color="#FFFFFF" size={16} />,
      timestamp: timestamps['out-for-delivery'] || timestamps.outForDeliveryAt,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: <CheckCircle2 color="#FFFFFF" size={16} />,
      timestamp: timestamps.delivered || timestamps.deliveredAt,
    },
  ];

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const isRejected = currentStatus === 'rejected';
  const isCancelled = currentStatus === 'cancelled';

  if (isRejected || isCancelled) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <View style={[styles.errorIcon, isRejected && styles.rejectedIcon]}>
            <X color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.errorTitle}>
            {isRejected ? 'Order Rejected' : 'Order Cancelled'}
          </Text>
          <Text style={styles.errorSubtitle}>
            {isRejected
              ? 'The restaurant cannot fulfill this order at the moment'
              : 'This order has been cancelled'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>
      
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <TimelineItem
              key={step.status}
              step={step}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isLast={isLast}
              index={index}
            />
          );
        })}
      </View>
    </View>
  );
}

function TimelineItem({
  step,
  isCompleted,
  isCurrent,
  isLast,
  index,
}: {
  step: TimelineStep;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
  index: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isCompleted) {
      scale.value = withDelay(
        index * 150,
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      opacity.value = withDelay(index * 150, withTiming(1, { duration: 300 }));
    }
  }, [isCompleted, index]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const timestamp = step.timestamp
    ? new Date(step.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <Animated.View
          style={[
            styles.iconContainer,
            isCompleted && styles.iconContainerActive,
            isCurrent && styles.iconContainerCurrent,
            animatedIconStyle,
          ]}
        >
          {step.icon}
        </Animated.View>
        
        {!isLast && (
          <View
            style={[
              styles.connector,
              isCompleted && styles.connectorActive,
            ]}
          />
        )}
      </View>

      <Animated.View style={[styles.timelineContent, animatedTextStyle]}>
        <Text
          style={[
            styles.stepLabel,
            isCompleted && styles.stepLabelActive,
            isCurrent && styles.stepLabelCurrent,
          ]}
        >
          {step.label}
        </Text>
        
        {timestamp && isCompleted && (
          <Text style={styles.timestamp}>{timestamp}</Text>
        )}
        
        {isCurrent && (
          <View style={styles.currentBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.currentText}>In Progress</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: authTheme.text,
    marginBottom: 20,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: authTheme.cardBorder,
    zIndex: 2,
  },
  iconContainerActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  iconContainerCurrent: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
    shadowColor: authTheme.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 40,
    backgroundColor: authTheme.cardBorder,
    marginVertical: 4,
    zIndex: 1,
  },
  connectorActive: {
    backgroundColor: authTheme.brand,
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 8,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: authTheme.textMuted,
    marginBottom: 4,
  },
  stepLabelActive: {
    color: authTheme.text,
  },
  stepLabelCurrent: {
    color: authTheme.brand,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: authTheme.textMuted,
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: authTheme.brand,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '600',
    color: authTheme.brand,
  },
  errorCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rejectedIcon: {
    backgroundColor: '#F59E0B',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: authTheme.text,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: authTheme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});