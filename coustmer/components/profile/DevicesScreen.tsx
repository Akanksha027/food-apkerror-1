import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Plus, Smartphone, Trash2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyView, ErrorView, LoadingView } from '@/components/common/StateViews';
import { ProfileFormLayout } from '@/components/profile/ProfileFormLayout';
import { authTheme } from '@/constants/auth-theme';
import { useDevices, useRegisterDevice, useRemoveDevice } from '@/lib/profile/hooks';

function getDeviceId() {
  return Constants.installationId ?? Constants.sessionId ?? `device_${Date.now()}`;
}

export function DevicesScreen() {
  const { data, isLoading, isError, error, refetch } = useDevices();
  const registerDevice = useRegisterDevice();
  const removeDevice = useRemoveDevice();

  const handleRegister = () => {
    registerDevice.mutate({
      deviceId: getDeviceId(),
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceName: `${Platform.OS} device`,
    });
  };

  return (
    <ProfileFormLayout
      title="Push devices"
      subtitle="Manage notification devices"
      onSave={handleRegister}
      saveLabel={registerDevice.isPending ? 'Registering…' : 'Register this device'}
      saving={registerDevice.isPending}
    >
      {isLoading ? (
        <LoadingView label="Loading devices…" />
      ) : isError ? (
        <ErrorView
          message={error instanceof Error ? error.message : 'Failed to load'}
          onRetry={refetch}
        />
      ) : !data?.length ? (
        <EmptyView
          icon={<Smartphone color={authTheme.textDim} size={40} />}
          title="No devices registered"
          subtitle="Register this device to receive push notifications."
        />
      ) : (
        <FlatList
          data={data}
          scrollEnabled={false}
          keyExtractor={(item) => item.id || item.deviceId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Smartphone color={authTheme.brand} size={20} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>
                  {item.deviceName ?? item.deviceType ?? 'Device'}
                </Text>
                <Text style={styles.meta}>ID: {item.deviceId}</Text>
                {item.lastSeen ? (
                  <Text style={styles.meta}>
                    Last seen: {new Date(item.lastSeen).toLocaleString()}
                  </Text>
                ) : null}
              </View>
              <Pressable
                style={styles.removeButton}
                onPress={() => removeDevice.mutate(item.deviceId)}
                disabled={removeDevice.isPending}
              >
                {removeDevice.isPending &&
                removeDevice.variables === item.deviceId ? (
                  <ActivityIndicator color={authTheme.error} size="small" />
                ) : (
                  <Trash2 color={authTheme.error} size={18} />
                )}
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable style={styles.registerHint} onPress={handleRegister}>
        <Plus color={authTheme.brand} size={16} />
        <Text style={styles.registerHintText}>Quick register this device</Text>
      </Pressable>
    </ProfileFormLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  registerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  registerHintText: {
    color: authTheme.brand,
    fontWeight: '600',
    fontSize: 14,
  },
});
