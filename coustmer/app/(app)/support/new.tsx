import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { authTheme } from '@/constants/auth-theme';
import { useCreateTicket } from '@/lib/customer/hooks';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_CATEGORY_LABELS,
  type SupportCategory,
} from '@/lib/customer/types';

export default function NewTicketScreen() {
  const router = useRouter();
  const createTicket = useCreateTicket();

  const [category, setCategory] = useState<SupportCategory>('order_issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const handleSubmit = () => {
    const nextErrors = {
      subject: subject.trim().length < 3 ? 'Subject is too short' : null,
      description:
        description.trim().length < 10
          ? 'Please describe the issue (min 10 characters)'
          : null,
    };
    setErrors(nextErrors);
    setBanner(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    createTicket.mutate(
      {
        category,
        subject: subject.trim(),
        description: description.trim(),
      },
      {
        onSuccess: (ticket) => {
          router.replace({
            pathname: '/support/[ticketId]',
            params: { ticketId: ticket.id },
          });
        },
        onError: (error) => {
          setBanner(
            error instanceof Error ? error.message : 'Failed to create ticket'
          );
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <ScreenHeader title="New ticket" subtitle="Tell us what went wrong" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            {banner ? (
              <AuthMessageBanner message={banner} type="error" />
            ) : null}

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {SUPPORT_CATEGORIES.map((cat) => {
                const active = cat === category;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.categoryChip, active && styles.categoryActive]}
                    onPress={() => setCategory(cat)}
                  >
                    {active ? <Check color="#FFFFFF" size={14} /> : null}
                    <Text
                      style={[
                        styles.categoryText,
                        active && styles.categoryTextActive,
                      ]}
                    >
                      {SUPPORT_CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Payment deducted but no order"
              placeholderTextColor={authTheme.textDim}
              maxLength={120}
            />
            {errors.subject ? (
              <Text style={styles.error}>{errors.subject}</Text>
            ) : null}

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your issue in detail…"
              placeholderTextColor={authTheme.textDim}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            {errors.description ? (
              <Text style={styles.error}>{errors.description}</Text>
            ) : null}

            <Pressable
              style={[
                styles.submitButton,
                createTicket.isPending && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={createTicket.isPending}
            >
              <Text style={styles.submitText}>
                {createTicket.isPending ? 'Submitting…' : 'Submit ticket'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scroll: {
    paddingBottom: 32,
  },
  label: {
    color: authTheme.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: authTheme.card,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  categoryText: {
    color: authTheme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: authTheme.input,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 10 : 14,
    fontSize: 15,
    color: authTheme.text,
  },
  textarea: {
    minHeight: 120,
  },
  error: {
    color: authTheme.error,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: authTheme.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
