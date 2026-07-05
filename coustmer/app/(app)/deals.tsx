import { Tag } from 'lucide-react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import { useDeals } from '@/lib/customer/hooks';

export default function DealsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDeals();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Deals & Offers" subtitle="Save on your next order" />

        {isLoading ? (
          <LoadingView label="Fetching deals…" />
        ) : isError ? (
          <ErrorView
            message={error instanceof Error ? error.message : 'Failed to load'}
            onRetry={refetch}
          />
        ) : !data || data.length === 0 ? (
          <EmptyView
            icon={<Tag color={authTheme.textDim} size={40} />}
            title="No active deals"
            subtitle="Check back later for discounts and promo offers."
          />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => String(item.id ?? index)}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.dealCard}>
                <View style={styles.dealIcon}>
                  <Tag color={authTheme.brand} size={20} />
                </View>
                <View style={styles.dealBody}>
                  <Text style={styles.dealTitle}>{item.title ?? 'Deal'}</Text>
                  {item.description ? (
                    <Text style={styles.dealDesc}>{item.description}</Text>
                  ) : null}
                  {item.code ? (
                    <View style={styles.codePill}>
                      <Text style={styles.codeText}>{item.code}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
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
  list: {
    paddingBottom: 24,
    gap: 12,
  },
  dealCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
  },
  dealIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealBody: {
    flex: 1,
  },
  dealTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dealDesc: {
    color: authTheme.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  codePill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: authTheme.brand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codeText: {
    color: authTheme.brand,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
});
