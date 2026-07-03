import type { LucideIcon } from 'lucide-react-native';
import { memo, useCallback, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type AuthInputProps = TextInputProps & {
  label?: string;
  icon?: LucideIcon;
  error?: string | null;
  rightElement?: React.ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  compact?: boolean;
};

function AuthInputComponent({
  label = '',
  icon: Icon,
  error,
  rightElement,
  required,
  hideLabel,
  compact,
  onFocus,
  onBlur,
  style,
  ...props
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {!hideLabel && label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {Icon ? (
          <View
            style={[
              styles.iconCircle,
              focused && styles.iconCircleFocused,
              error ? styles.iconCircleError : null,
            ]}
          >
            <Icon
              color={
                error ? authTheme.error : focused ? authTheme.brand : authTheme.textDim
              }
              size={17}
              strokeWidth={2}
            />
          </View>
        ) : null}
        <TextInput
          {...props}
          placeholderTextColor={authTheme.textDim}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={props.autoCorrect ?? false}
          spellCheck={props.spellCheck ?? false}
          importantForAutofill={
            props.importantForAutofill ?? (Platform.OS === 'android' ? 'no' : 'auto')
          }
          disableFullscreenUI={Platform.OS === 'android'}
        />
        {rightElement}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export const AuthInput = memo(AuthInputComponent);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  wrapperCompact: {
    marginBottom: 0,
  },
  label: {
    color: authTheme.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  required: {
    color: authTheme.brand,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: authTheme.input,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 16,
    paddingLeft: 8,
    paddingRight: 4,
    minHeight: 56,
  },
  inputFocused: {
    borderColor: authTheme.brand,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: authTheme.brand,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        }
      : {}),
  },
  inputError: {
    borderColor: authTheme.error,
    backgroundColor: '#FEF2F2',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: authTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  iconCircleFocused: {
    backgroundColor: authTheme.brandSoft,
  },
  iconCircleError: {
    backgroundColor: '#FEE2E2',
  },
  input: {
    flex: 1,
    color: authTheme.text,
    fontSize: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 14,
    paddingRight: 12,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  error: {
    color: authTheme.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
