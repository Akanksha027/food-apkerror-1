import { StyleSheet, View } from 'react-native';

/** Official Indian vegetarian mark — green square with filled green circle. */
export function VegMarkIcon({ size = 14 }: { size?: number }) {
  const inner = Math.round(size * 0.45);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.12 }]}>
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: '#0F8A45',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    borderColor: '#0F8A45',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
