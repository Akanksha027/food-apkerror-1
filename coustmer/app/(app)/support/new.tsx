import { Pressable } from '@/components/common/Pressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, HelpCircle, CreditCard, Truck, AlertTriangle, MessageSquare, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { KeyboardAvoidingView,
  Platform,
  
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { CustomerServiceStatus } from '@/components/customer/CustomerServiceStatus';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useCreateTicket } from '@/lib/customer/hooks';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_CATEGORY_LABELS,
  type SupportCategory,
} from '@/lib/customer/types';

export default function NewTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const createTicket = useCreateTicket();

  const [category, setCategory] = useState<SupportCategory>('order_issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<string | null>(null);

  // Quick subjects mapped by category
  const quickSubjects: Record<SupportCategory, string[]> = {
    order_issue: ['Missing items', 'Wrong order received', 'Food arrived cold'],
    payment_issue: ['Charged but order failed', 'Did not receive refund'],
    delivery_issue: ['Order is extremely late', 'Delivery partner was rude'],
    account_issue: ['Cannot update profile', 'Trouble logging in'],
    restaurant_issue: ['Restaurant closed but accepted order'],
    other: ['App is crashing', 'Feature request'],
  };

  // Category icons mapping
  const categoryIcons = {
    order_issue: Truck,
    payment_issue: CreditCard,
    delivery_issue: Truck,
    account_issue: MessageSquare,
    restaurant_issue: AlertTriangle,
    other: HelpCircle,
  } as const;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setAttachments((prev) => [...prev, b64]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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
        orderId: params.orderId,
        attachments: attachments.length > 0 ? attachments : undefined,
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

          <CustomerServiceStatus />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            {banner ? (
              <AuthMessageBanner message={banner} type="error" />
            ) : null}

            {params.orderId && (
              <View style={styles.linkedOrderCard}>
                <Truck color={authTheme.brand} size={20} />
                <View>
                  <Text style={styles.linkedOrderTitle}>Linked Order</Text>
                  <Text style={styles.linkedOrderValue}>#{params.orderId.slice(-10).toUpperCase()}</Text>
                </View>
              </View>
            )}

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {SUPPORT_CATEGORIES.map((cat) => {
                const active = cat === category;
                const Icon = categoryIcons[cat];
                return (
                  <Pressable
                    key={cat}
                    style={[styles.categoryChip, active && styles.categoryActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Icon 
                      color={active ? "#FFFFFF" : authTheme.textMuted} 
                      size={16} 
                      strokeWidth={1.7}
                    />
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
            <View style={styles.quickSubjectScrollWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickSubjectScroll}>
                {quickSubjects[category]?.map((qs) => (
                  <Pressable key={qs} style={styles.quickSubjectChip} onPress={() => setSubject(qs)}>
                    <Text style={styles.quickSubjectText}>{qs}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
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

            <View style={styles.attachmentsHeader}>
              <Text style={styles.label}>Attachments</Text>
              <Text style={styles.optionalText}>(Optional)</Text>
            </View>
            
            <View style={styles.attachmentsContainer}>
              {attachments.map((uri, idx) => (
                <View key={idx} style={styles.attachmentWrapper}>
                  <Image source={{ uri }} style={styles.attachmentImg} />
                  <Pressable style={styles.removeAttachmentBtn} onPress={() => removeAttachment(idx)}>
                    <X color="#FFFFFF" size={14} strokeWidth={3} />
                  </Pressable>
                </View>
              ))}
              
              {attachments.length < 3 && (
                <Pressable style={styles.addAttachmentBtn} onPress={pickImage}>
                  <Camera color={authTheme.brand} size={24} />
                  <Text style={styles.addAttachmentText}>Add Photo</Text>
                </Pressable>
              )}
            </View>

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
    gap: 8,
    backgroundColor: authTheme.card,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: '47%',
    flex: 1,
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
  linkedOrderCard: {
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: '#FFD4C2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  linkedOrderTitle: {
    fontSize: 12,
    color: '#F15700',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  linkedOrderValue: {
    fontSize: 15,
    color: '#F15700',
    fontWeight: '500',
  },
  quickSubjectScrollWrapper: {
    marginHorizontal: -20,
    marginBottom: 12,
  },
  quickSubjectScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  quickSubjectChip: {
    backgroundColor: authTheme.card,
    borderWidth: 1,
    borderColor: authTheme.inputBorder,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickSubjectText: {
    fontSize: 13,
    color: authTheme.text,
    fontWeight: '500',
  },
  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionalText: {
    fontSize: 13,
    color: authTheme.textDim,
    marginTop: 20,
    marginBottom: 10,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  attachmentWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: authTheme.inputBorder,
  },
  attachmentImg: {
    width: '100%',
    height: '100%',
  },
  removeAttachmentBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  addAttachmentBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: authTheme.inputBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: authTheme.input,
    gap: 4,
  },
  addAttachmentText: {
    fontSize: 10,
    color: authTheme.brand,
    fontWeight: '600',
  },
});
