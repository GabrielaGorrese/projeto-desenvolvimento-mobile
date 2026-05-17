import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

export default function FloatingActionButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel="Adicionar comanda"
    >
      <Text style={styles.icon}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 34,
    bottom: 120,
    width: 65,
    height: 65,
    borderRadius: 72,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  icon: {
    fontSize: 40,
    color: colors.white,
    lineHeight: 44,
    fontWeight: '300',
  },
});
