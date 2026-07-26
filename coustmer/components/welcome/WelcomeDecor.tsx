import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { authTheme } from '@/constants/auth-theme';

export function WelcomeDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Path
          d="M-20 0 C40 20 80 60 70 110 C60 160 20 190 -10 210 C-30 140 -40 60 -20 0 Z"
          fill={authTheme.brandLight}
          opacity={0.28}
        />
        <Path
          d="M420 700 C360 730 300 760 280 810 C260 860 300 900 340 920 C380 850 410 780 420 700 Z"
          fill={authTheme.brandLight}
          opacity={0.24}
        />
        <Path
          d="M350 40 C380 80 400 120 385 150 C370 180 330 190 310 170 C330 120 340 80 350 40 Z"
          fill="#FFFFFF"
          opacity={0.07}
        />
        <Path
          d="M30 620 C60 640 80 670 65 700 C50 730 20 740 0 720 C15 680 20 640 30 620 Z"
          fill="#FFFFFF"
          opacity={0.06}
        />

        <Circle cx={320} cy={120} r={16} fill="#FFFFFF" opacity={0.12} />
        <Circle cx={60} cy={280} r={10} fill="#FFFFFF" opacity={0.09} />
        <Circle cx={340} cy={420} r={12} fill="#FFFFFF" opacity={0.1} />
        <Circle cx={90} cy={520} r={8} fill="#FFFFFF" opacity={0.08} />
        <Circle cx={280} cy={640} r={14} fill="#FFFFFF" opacity={0.09} />
        <Circle cx={180} cy={760} r={9} fill="#FFFFFF" opacity={0.07} />
      </Svg>
    </View>
  );
}
