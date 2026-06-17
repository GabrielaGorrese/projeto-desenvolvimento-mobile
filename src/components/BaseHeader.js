import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

export default function BaseHeader({
  left,
  center,
  right,
  style,
  contentStyle,
}) {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const minSide = Math.min(r.width, r.height);

  const paddingTop = insets.top + scaleSize(24, minSide);
  const paddingHorizontal = scaleSize(20, minSide);
  const paddingBottom = scaleSize(32, minSide);
  const gap = scaleSize(18, minSide);
  const minHeight = Math.round(Math.max(60, Math.min(96, minSide * 0.09)));
  const placeholderSize = Math.round(Math.max(56, Math.min(96, minSide * 0.085)));

  return (
    <View style={[styles.wrap, { paddingTop, paddingHorizontal, paddingBottom }, style]}>
      <View style={[styles.row, { gap, minHeight }, contentStyle]}>
        {left || <View style={{ width: placeholderSize, height: placeholderSize }} />}
        <View style={styles.center}>
          {center}
        </View>
        {right || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
  },
});