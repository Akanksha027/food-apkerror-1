import { Apple, Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { BRAND_NAME, theme } from '@/constants/theme';

export function AuthDivider({ label }: { label: string }) {
  return (
    <View className="my-5 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-gray-200" />
      <Text className="text-xs font-semibold uppercase tracking-widest text-secondary-light">
        {label}
      </Text>
      <View className="h-px flex-1 bg-gray-200" />
    </View>
  );
}

type SocialButtonsProps = {
  onGoogle: () => void;
  onApple: () => void;
};

export function SocialButtons({ onGoogle, onApple }: SocialButtonsProps) {
  return (
    <View className="flex-row gap-3">
      <Pressable
        onPress={onGoogle}
        className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white active:bg-surface"
      >
        <Text className="text-base font-extrabold text-[#4285F4]">G</Text>
        <Text className="text-sm font-semibold text-secondary">Google</Text>
      </Pressable>
      <Pressable
        onPress={onApple}
        className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white active:bg-surface"
      >
        <Apple color={theme.secondary} size={18} fill={theme.secondary} />
        <Text className="text-sm font-semibold text-secondary">Apple</Text>
      </Pressable>
    </View>
  );
}

type CheckboxRowProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export function CheckboxRow({ checked, onToggle, label }: CheckboxRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={6}
      className="flex-row items-center gap-2.5"
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-md border ${
          checked ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
        }`}
      >
        {checked ? <Check color="#FFFFFF" size={14} /> : null}
      </View>
      <Text className="text-sm text-secondary-light">{label}</Text>
    </Pressable>
  );
}

export function LegalFooter() {
  return (
    <View className="mt-6 items-center gap-1">
      <View className="flex-row items-center gap-4">
        {['Privacy', 'Terms', 'Support'].map((item) => (
          <Text key={item} className="text-xs font-medium text-secondary-light">
            {item}
          </Text>
        ))}
      </View>
      <Text className="text-xs text-gray-400">
        © 2024 {BRAND_NAME}
      </Text>
    </View>
  );
}
