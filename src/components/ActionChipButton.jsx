import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function ActionChipButton({ label, icon = 'add', onPress }) {
  const iconName = icon === 'clear' ? 'close-circle-outline' : 'add-circle-outline';

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Ionicons name={iconName} size={14} color={colors.sectionTitle} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.chipBackground,
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 12,
    color: colors.sectionTitle,
    textAlign: 'center',
  },
});
