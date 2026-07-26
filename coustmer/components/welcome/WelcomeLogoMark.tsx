import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { authTheme } from '@/constants/auth-theme';

type Props = {
  width?: number;
  height?: number;
};

/** Delivery cloche mark inside an organic white blob — matches splash reference. */
export function WelcomeLogoMark({ width = 230, height = 198 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 220 190">
      <Path
        d="M110 10 C145 8 182 28 195 62 C208 96 192 138 158 162 C124 182 76 182 48 158 C20 134 12 88 28 52 C44 22 75 12 110 10 Z"
        fill="#FFFFFF"
      />

      <Path d="M58 78 H118 L128 98 H48 Z" fill={authTheme.brandLight} />
      <Path
        d="M48 98 H128 C132 98 135 101 135 105 V108 C135 112 132 115 128 115 H48 C44 115 41 112 41 108 V105 C41 101 44 98 48 98 Z"
        fill={authTheme.brand}
      />
      <Path
        d="M88 58 C88 44 98 34 112 34 C126 34 136 44 136 58 V78 H88 Z"
        fill={authTheme.brandDark}
      />
      <Path
        d="M136 72 C152 72 164 82 168 96 L172 108 H132 L128 96 C130 84 132 72 136 72 Z"
        fill={authTheme.brandLight}
      />

      <Path
        d="M36 88 H44 V92 H32 V86 C32 82 36 78 40 78 H46 V84 H40 C38 84 36 86 36 88 Z"
        fill="#FFFFFF"
        opacity={0.85}
      />
      <Path
        d="M28 98 H38 V102 H24 V96 C24 92 28 88 32 88 H40 V94 H32 C30 94 28 96 28 98 Z"
        fill="#FFFFFF"
        opacity={0.7}
      />
      <Path
        d="M22 108 H34 V112 H18 V106 C18 102 22 98 26 98 H36 V104 H26 C24 104 22 106 22 108 Z"
        fill="#FFFFFF"
        opacity={0.55}
      />

      <Circle cx={68} cy={128} r={11} fill={authTheme.brandDark} />
      <Circle cx={68} cy={128} r={5} fill="#FFFFFF" opacity={0.35} />
      <Circle cx={108} cy={128} r={11} fill={authTheme.brandDark} />
      <Circle cx={108} cy={128} r={5} fill="#FFFFFF" opacity={0.35} />

      <Rect x={60} y={118} width={56} height={6} rx={3} fill={authTheme.brandDark} opacity={0.35} />
    </Svg>
  );
}
