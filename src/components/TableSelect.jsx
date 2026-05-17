import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function TableSelect({
  value,
  placeholder = 'Selecionar',
  helperText = 'Deixe nulo para cadastrar pedido avulso.',
  onPress,
}) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.select}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.sectionTitle} style={styles.chevron} />
      </TouchableOpacity>

      <View style={styles.helperRow}>
        <Ionicons name="information-circle-outline" size={14} color={colors.helperText} />
        <Text style={styles.helperText}>{helperText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.selectBackground,
    borderWidth: 1,
    borderColor: colors.selectBorder,
    borderRadius: 8,
    height: 30,
    paddingHorizontal: 12,
    width: 103,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sectionTitle,
  },
  placeholder: {
    opacity: 0.3,
  },
  chevron: {
    opacity: 0.4,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginLeft: 120,
  },
  helperText: {
    fontSize: 7,
    color: colors.helperText,
    flex: 1,
    lineHeight: 10,
  },
});
