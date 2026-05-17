import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ScreenSectionTitle({ title }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.sectionTitle,
    marginBottom: 16,
  },
});
