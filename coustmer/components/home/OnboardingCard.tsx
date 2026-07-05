import { CheckCircle2, Circle } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import {
  useCompleteOnboardingStep,
  useOnboardingStatus,
} from '@/lib/customer/hooks';

export function OnboardingCard() {
  const { data, isLoading } = useOnboardingStatus();
  const completeStep = useCompleteOnboardingStep();

  if (isLoading || !data || data.completed) {
    return null;
  }

  const { currentStep, totalSteps } = data;
  const progress = totalSteps > 0 ? currentStep / totalSteps : 0;
  const nextStep = currentStep + 1;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Circle color={authTheme.brand} size={20} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Finish setting up your account</Text>
          <Text style={styles.subtitle}>
            Step {currentStep} of {totalSteps} completed
          </Text>
        </View>
        <CheckCircle2 color={authTheme.textDim} size={20} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Pressable
        style={styles.button}
        onPress={() => completeStep.mutate(nextStep)}
        disabled={completeStep.isPending || nextStep > totalSteps}
      >
        {completeStep.isPending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>
            {nextStep > totalSteps ? 'All done' : 'Complete next step'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: authTheme.input,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: authTheme.brand,
    borderRadius: 3,
  },
  button: {
    marginTop: 14,
    backgroundColor: authTheme.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
