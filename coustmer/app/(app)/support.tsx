import { useRouter } from 'expo-router';
import { ChevronRight, LifeBuoy, Plus } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import { useTickets } from '@/lib/customer/hooks';
import {
  SUPPORT_CATEGORY_LABELS,
  type TicketStatus,
} from '@/lib/customer/types';

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: '#2563EB',
  in_progress: '#D97706',
  resolved: '#16A34A',
  closed: authTheme.textMuted,
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function SupportListScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useTickets();
  const tickets = data?.tickets ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Support"
          subtitle="Get help with your orders"
          right={
            <Pressable
              style={styles.newButton}
              onPress={() => router.push('/support/new')}
            >
              <Plus color="#FFFFFF" size={18} />
            </Pressable>
          }
        />

        {isLoading ? (
          <LoadingView label="Loading tickets…" />
        ) : isError ? (
          <ErrorView
            message={error instanceof Error ? error.message : 'Failed to load'}
            onRetry={refetch}
          />
        ) : tickets.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyView
              icon={<LifeBuoy color={authTheme.textDim} size={40} />}
              title="No support tickets"
              subtitle="Raise a ticket and our team will help you out."
            />
            <Pressable
              style={styles.createButton}
              onPress={() => router.push('/support/new')}
            >
              <Text style={styles.createButtonText}>Create a ticket</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.ticketCard}
                onPress={() =>
                  router.push({
                    pathname: '/support/[ticketId]',
                    params: { ticketId: item.id },
                  })
                }
              >
                <View style={styles.ticketBody}>
                  <View style={styles.ticketTopRow}>
                    <Text style={styles.category}>
                      {SUPPORT_CATEGORY_LABELS[item.category] ?? item.category}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: `${STATUS_COLORS[item.status]}1A`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: STATUS_COLORS[item.status] },
                        ]}
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subject} numberOfLines={1}>
                    {item.subject}
                  </Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <ChevronRight color={authTheme.textMuted} size={18} />
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: authTheme.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingBottom: 24,
    gap: 12,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
  },
  ticketBody: {
    flex: 1,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  category: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subject: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  desc: {
    color: authTheme.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
