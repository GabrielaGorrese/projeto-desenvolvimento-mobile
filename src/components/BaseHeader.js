import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function BaseHeader({
  left,
  center,
  right,
  style,
  contentStyle,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 16 }, style]}>
      <View style={[styles.row, contentStyle]}>
        {/* LEFT */}
        {left || <View style={styles.leftPlaceholder} />}

        {/* CENTER */}
        <View style={styles.center}>
          {center}
        </View>

        {/* RIGHT */}
        {right || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  leftPlaceholder: {
    width: 54,
    height: 54,
  },

  center: {
    flex: 1,
  },
});