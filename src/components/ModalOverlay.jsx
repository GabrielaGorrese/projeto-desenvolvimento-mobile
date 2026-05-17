import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ModalOverlay({ onPress }) {
  return (
    <Pressable
      style={styles.overlay}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Fechar"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
});
