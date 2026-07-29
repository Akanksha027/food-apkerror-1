import { Pressable } from '@/components/common/Pressable';
import { Monitor, Smartphone, Trash2 } from 'lucide-react-native';
import { ActivityIndicator,
  FlatList,
  
  StyleSheet,
  Text,
  View } from 'react-native';

import { EmptyView, ErrorView, LoadingView } from '@/components/common/StateViews';
import { ProfileFormLayout } from '@/components/profile/ProfileFormLayout';
import { authTheme } from '@/constants/auth-theme';
import { useRevokeSession, useSessions } from '@/lib/profile/hooks';

export function SessionsScreen() {
  const { data, isLoading, isError, error, refetch } = useSessions();
  const revokeSession = useRevokeSession();

  return (
    <ProfileFormLayout
      title="Active sessions"
      subtitle="Devices where you're logged in"
    >
      {isLoading ? (
        <LoadingView label="Loading sessions…" />
      ) : isError ? (
        <ErrorView
          message={error instanceof Error ? error.message : 'Failed to load'}
          onRetry={refetch}
        />
      ) : !data?.length ? (
        <EmptyView
          title="No active sessions"
          subtitle="Session history will appear here when available."
        />
      ) : (
        <FlatList
          data={data}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                {item.deviceType?.includes('mobile') ? (
                  <Smartphone color={authTheme.brand} size={20} />
                ) : (
                  <Monitor color={authTheme.brand} size={20} />
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>
                  {item.deviceName ?? item.deviceType ?? 'Unknown device'}
                </Text>
                {item.ipAddress ? (
                  <Text style={styles.meta}>IP: {item.ipAddress}</Text>
                ) : null}
                {item.lastActive ? (
                  <Text style={styles.meta}>
                    Last active: {new Date(item.lastActive).toLocaleString()}
                  </Text>
                ) : null}
                {item.isCurrent ? (
                  <Text style={styles.current}>Current session</Text>
                ) : null}
              </View>
              {!item.isCurrent ? (
                <Pressable
                  style={styles.revokeButton}
                  onPress={() => revokeSession.mutate(item.id)}
                  disabled={revokeSession.isPending}
                >
                  {revokeSession.isPending &&
                  revokeSession.variables === item.id ? (
                    <ActivityIndicator color={authTheme.error} size="small" />
                  ) : (
                    <Trash2 color={authTheme.error} size={18} />
                  )}
                </Pressable>
              ) : null}
            </View>
          )}
        />
      )}
    </ProfileFormLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
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
  current: {
    color: authTheme.brand,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  revokeButton: {
    padding: 8,
  },
});
