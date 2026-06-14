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
    <View style={[styles.wrap, { paddingTop: insets.top + 24 }, style]}>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    minHeight: 76,
  },

  leftPlaceholder: {
    width: 72,
    height: 72,
  },

  center: {
    flex: 1,
  },
});
