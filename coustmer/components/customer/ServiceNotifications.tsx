import { Pressable } from '@/components/common/Pressable';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet,  Animated } from 'react-native';
import { Bell, X, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface ServiceNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  autoHide?: boolean;
  duration?: number;
}

interface Props {
  notifications: ServiceNotification[];
  onDismiss: (id: string) => void;
}

const NOTIFICATION_COLORS = {
  info: '#3182CE',
  success: '#16A34A', 
  warning: '#D97706',
  error: '#E53E3E',
};

const NOTIFICATION_ICONS = {
  info: Bell,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
};

export function ServiceNotifications({ notifications, onDismiss }: Props) {
  const [animatedValues] = useState(
    () => new Map(notifications.map(n => [n.id, new Animated.Value(0)]))
  );

  useEffect(() => {
    notifications.forEach((notification) => {
      if (!animatedValues.has(notification.id)) {
        animatedValues.set(notification.id, new Animated.Value(0));
      }
      
      const animValue = animatedValues.get(notification.id)!;
      
      // Animate in
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide if specified
      if (notification.autoHide !== false) {
        const timeout = setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration || 5000);
        
        return () => clearTimeout(timeout);
      }
    });
  }, [notifications, animatedValues, onDismiss]);

  const handleDismiss = (id: string) => {
    const animValue = animatedValues.get(id);
    if (animValue) {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onDismiss(id);
        animatedValues.delete(id);
      });
    } else {
      onDismiss(id);
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {notifications.map((notification) => {
        const Icon = NOTIFICATION_ICONS[notification.type];
        const color = NOTIFICATION_COLORS[notification.type];
        const animValue = animatedValues.get(notification.id);

        return (
          <Animated.View
            key={notification.id}
            style={[
              styles.notification,
              { 
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                opacity: animValue || 1,
                transform: [{
                  translateY: animValue ? animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }) : 0
                }]
              },
            ]}
          >
            <View style={styles.content}>
              <Icon color={color} size={18} strokeWidth={1.7} />
              
              <View style={styles.textContent}>
                <Text style={[styles.title, { color }]}>
                  {notification.title}
                </Text>
                <Text style={styles.message}>
                  {notification.message}
                </Text>
                
                {notification.action && (
                  <Pressable
                    style={[styles.actionBtn, { borderColor: color }]}
                    onPress={notification.action.onPress}
                  >
                    <Text style={[styles.actionText, { color }]}>
                      {notification.action.label}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <Pressable
              style={styles.closeBtn}
              onPress={() => handleDismiss(notification.id)}
            >
              <X color={authTheme.textMuted} size={16} />
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 50, // Account for status bar
    gap: 8,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: authTheme.text,
    lineHeight: 18,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

// Hook for managing service notifications
export function useServiceNotifications() {
  const [notifications, setNotifications] = useState<ServiceNotification[]>([]);

  const addNotification = (notification: Omit<ServiceNotification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Pre-built notification helpers
  const showTicketUpdate = (ticketId: string, status: string) => {
    const statusMessages = {
      'in_progress': 'Your support ticket is now being reviewed by our team.',
      'resolved': 'Great news! Your support ticket has been resolved.',
      'closed': 'Your support ticket has been closed.',
    };

    addNotification({
      type: status === 'resolved' ? 'success' : 'info',
      title: 'Ticket Updated',
      message: statusMessages[status as keyof typeof statusMessages] || 'Your ticket status has been updated.',
      action: {
        label: 'View Ticket',
        onPress: () => {
          // Handle navigation to ticket
          console.log('Navigate to ticket:', ticketId);
        },
      },
    });
  };

  const showServiceError = (message: string) => {
    addNotification({
      type: 'error',
      title: 'Service Error',
      message,
      autoHide: false,
    });
  };

  const showServiceRestored = () => {
    addNotification({
      type: 'success',
      title: 'Service Restored',
      message: 'Customer service is back online and functioning normally.',
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showTicketUpdate,
    showServiceError,
    showServiceRestored,
  };
}