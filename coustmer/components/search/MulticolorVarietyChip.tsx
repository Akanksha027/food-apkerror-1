import { Pressable } from '@/components/common/Pressable';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { fonts } from '@/constants/typography';

/** Shared iridescent gradient used on every variety chip (border + label). */
export const VARIETY_RAINBOW = [
  '#A855F7',
  '#EC4899',
  '#F97316',
  '#FACC15',
  '#22D3EE',
] as const;

/** Very light multicolor wash for the selected chip fill. */
const VARIETY_FILL_LIGHT = [
  'rgba(168, 85, 247, 0.06)',
  'rgba(236, 72, 153, 0.05)',
  'rgba(249, 115, 22, 0.05)',
  'rgba(250, 204, 21, 0.05)',
  'rgba(34, 211, 238, 0.06)',
] as const;

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

function GradientLabel({ text }: { text: string }) {
  const width = Math.ceil(text.length * 7.6 + 2);
  const height = 18;
  const gradId = `varietyGrad-${text.replace(/\s+/g, '-')}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={VARIETY_RAINBOW[0]} />
          <Stop offset="25%" stopColor={VARIETY_RAINBOW[1]} />
          <Stop offset="50%" stopColor={VARIETY_RAINBOW[2]} />
          <Stop offset="75%" stopColor={VARIETY_RAINBOW[3]} />
          <Stop offset="100%" stopColor={VARIETY_RAINBOW[4]} />
        </SvgGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradId})`}
        fontSize={13}
        fontFamily={fonts.uiSemi}
        fontWeight="600"
        x={0}
        y={14}
      >
        {text}
      </SvgText>
    </Svg>
  );
}

/** Variety pill with the same multicolor border + text on every chip. */
export function MulticolorVarietyChip({ label, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={[...VARIETY_RAINBOW]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.border}
      >
        {selected ? (
          <LinearGradient
            colors={[...VARIETY_FILL_LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inner}
          >
            <GradientLabel text={label} />
          </LinearGradient>
        ) : (
          <View style={styles.inner}>
            <GradientLabel text={label} />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.88,
  },
  border: {
    borderRadius: 18,
    padding: 1.5,
  },
  inner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16.5,
    paddingHorizontal: 14,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
