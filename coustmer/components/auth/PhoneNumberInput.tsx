import { ChevronDown } from 'lucide-react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/constants/colors';

type PhoneNumberInputProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function PhoneNumberInput({ value, onChangeText }: PhoneNumberInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phone Number</Text>
      <View style={styles.inputRow}>
        <View style={styles.countryCode}>
          <Text style={styles.codeText}>+1</Text>
          <ChevronDown color={colors.text.muted} size={14} />
        </View>
        <View style={styles.separator} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Enter your number"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    width: '100%',
  },
  label: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: 10,
  },
  codeText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text.primary,
  },
});
