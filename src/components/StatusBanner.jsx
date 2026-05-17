import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function StatusBanner({ label }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.banner}>
        <View style={styles.dot} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.statusBannerBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusBannerInner,
    borderRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 19,
    gap: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.tableWarning,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.statusText,
  },
});
