import { Pressable } from '@/components/common/Pressable';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator,
  Alert,
  
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import { useOrderIssues, useReportIssue } from '@/lib/order/hooks';
import { ORDER_ISSUE_TYPES } from '@/lib/order/types';

export function OrderIssuesScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = String(orderId ?? '');

  const issues = useOrderIssues(id);
  const report = useReportIssue(id);

  const [type, setType] = useState<string>(ORDER_ISSUE_TYPES[0].value);
  const [description, setDescription] = useState('');

  const submit = async () => {
    if (!description.trim()) {
      Alert.alert('Describe the issue');
      return;
    }
    try {
      await report.mutateAsync({
        type,
        description: description.trim(),
      });
      setDescription('');
      Alert.alert('Issue reported', 'Our team will look into it.');
      issues.refetch();
    } catch (e) {
      Alert.alert(
        'Failed',
        e instanceof Error ? e.message : 'Could not report issue'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader title="Order issues" subtitle={`#${id.slice(-8)}`} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Report a new issue</Text>
        <View style={styles.typeRow}>
          {ORDER_ISSUE_TYPES.map((item) => {
            const selected = type === item.value;
            return (
              <Pressable
                key={item.value}
                style={[styles.typeChip, selected && styles.typeChipActive]}
                onPress={() => setType(item.value)}
              >
                <Text
                  style={[
                    styles.typeText,
                    selected && styles.typeTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Tell us what went wrong…"
          placeholderTextColor={authTheme.textDim}
          value={description}
          onChangeText={setDescription}
        />

        <Pressable
          style={[styles.submit, report.isPending && styles.disabled]}
          onPress={submit}
          disabled={report.isPending}
        >
          {report.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit issue</Text>
          )}
        </Pressable>

        <Text style={styles.section}>Previously reported</Text>
        {issues.isLoading ? (
          <LoadingView label="Loading issues…" />
        ) : issues.isError ? (
          <ErrorView
            message={
              issues.error instanceof Error
                ? issues.error.message
                : 'Failed to load issues'
            }
            onRetry={issues.refetch}
          />
        ) : !issues.data?.length ? (
          <EmptyView
            title="No issues yet"
            subtitle="Problems with this order will show up here."
          />
        ) : (
          issues.data.map((issue) => (
            <View key={issue.id} style={styles.issueCard}>
              <Text style={styles.issueType}>{issue.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.issueDesc}>{issue.description}</Text>
              <View style={styles.issueMeta}>
                {issue.status ? (
                  <Text style={styles.metaText}>{issue.status}</Text>
                ) : null}
                {issue.createdAt ? (
                  <Text style={styles.metaText}>
                    {new Date(issue.createdAt).toLocaleString()}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authTheme.bg },
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  section: {
    color: authTheme.text,
    fontWeight: '900',
    fontSize: 15,
    marginTop: 4,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: authTheme.cardBorder,
    backgroundColor: authTheme.card,
  },
  typeChipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  typeText: { color: authTheme.text, fontWeight: '700', fontSize: 12 },
  typeTextActive: { color: '#FFFFFF' },
  input: {
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 14,
    padding: 12,
    textAlignVertical: 'top',
    color: authTheme.text,
  },
  submit: {
    backgroundColor: authTheme.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.65 },
  submitText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  issueCard: {
    backgroundColor: authTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 12,
    gap: 6,
  },
  issueType: {
    color: authTheme.brand,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  issueDesc: { color: authTheme.text, fontSize: 13, lineHeight: 18 },
  issueMeta: { flexDirection: 'row', gap: 10 },
  metaText: { color: authTheme.textMuted, fontSize: 11, fontWeight: '600' },
});
