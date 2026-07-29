import * as Haptics from 'expo-haptics';

export async function playHapticFeedback() {
  try {
    // Fire haptic motor
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // ignore
  }
}
