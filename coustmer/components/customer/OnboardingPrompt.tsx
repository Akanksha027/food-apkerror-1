import { Pressable } from '@/components/common/Pressable';
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, X } from 'lucide-react-native';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useCompleteOnboardingStep, useOnboardingStatus } from '@/lib/customer/hooks';

export function OnboardingPrompt() {
  const { data: onboarding } = useOnboardingStatus();
  const completeStep = useCompleteOnboardingStep();
  const [dismissed, setDismissed] = useState(false);

  if (!onboarding || onboarding.completed || dismissed) {
    return null;
  }

  const progress = (onboarding.currentStep / onboarding.totalSteps) * 100;

  const handleComplete = () => {
    completeStep.mutate(onboarding.currentStep + 1);
  };

  const getStepMessage = (step: number) => {
    switch (step) {
      case 0:
        return "Welcome! Let's set up your profile to get better recommendations.";
      case 1:
        return "Add your favorite cuisines to see personalized restaurant suggestions.";
      case 2:
        return "Save your delivery address for faster checkout.";
      default:
        return "Complete your profile setup for the best experience.";
    }
  };

  const getStepAction = (step: number) => {
    switch (step) {
      case 0:
        return "Complete Profile";
      case 1:
        return "Set Preferences";
      case 2:
        return "Add Address";
      default:
        return "Continue";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Pressable style={styles.closeBtn} onPress={() => setDismissed(true)}>
          <X color={authTheme.textMuted} size={16} />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        <CheckCircle color={authTheme.brand} size={20} />
        <View style={styles.textContent}>
          <Text style={styles.title}>
            Step {onboarding.currentStep + 1} of {onboarding.totalSteps}
          </Text>
          <Text style={styles.message}>
            {getStepMessage(onboarding.currentStep)}
          </Text>
        </View>
      </View>

      <Pressable 
        style={[styles.actionBtn, completeStep.isPending && styles.actionBtnDisabled]} 
        onPress={handleComplete}
        disabled={completeStep.isPending}
      >
        <Text style={styles.actionText}>
          {completeStep.isPending ? 'Completing...' : getStepAction(onboarding.currentStep)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: authTheme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    margin: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: authTheme.cardBorder,
    borderRadius: 2,
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: authTheme.brand,
    borderRadius: 2,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: authTheme.text,
    marginBottom: 2,
  },
  message: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: authTheme.textMuted,
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: authTheme.brand,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionText: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
});