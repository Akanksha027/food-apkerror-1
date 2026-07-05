import type { LucideIcon } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { theme } from '@/constants/theme';

type AuthFieldProps = TextInputProps & {
  label: string;
  icon?: LucideIcon;
  secure?: boolean;
  errorText?: string;
  /** Right-aligned element on the label row (e.g. a "Forgot?" link). */
  labelAccessory?: ReactNode;
};

export function AuthField({
  label,
  icon: Icon,
  secure,
  errorText,
  labelAccessory,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secure));

  const hasError = Boolean(errorText);

  return (
    <View className="mb-4">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-secondary">{label}</Text>
        {labelAccessory}
      </View>
      <View
        className={`h-12 flex-row items-center rounded-xl border px-3.5 ${
          hasError
            ? 'border-danger bg-danger/5'
            : focused
              ? 'border-primary bg-white'
              : 'border-gray-200 bg-white'
        }`}
      >
        {Icon ? (
          <Icon
            color={hasError ? theme.danger : focused ? theme.primary : theme.muted}
            size={18}
          />
        ) : null}
        <TextInput
          className="flex-1 pl-2.5 text-[15px] text-secondary"
          placeholderTextColor={theme.muted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10}>
            {hidden ? (
              <EyeOff color={theme.muted} size={18} />
            ) : (
              <Eye color={theme.primary} size={18} />
            )}
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <Text className="mt-1 text-xs font-medium text-danger">{errorText}</Text>
      ) : null}
    </View>
  );
}
