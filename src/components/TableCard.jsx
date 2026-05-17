import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import TableCardBadge from './TableCardBadge';
import { colors } from '../theme/colors';

const statusColors = {
  open: colors.tableOpen,
  warning: colors.tableWarning,
  closed: colors.tableClosed,
};

export default function TableCard({ number, status, onPress, showBadge = false }) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: statusColors[status] }]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Mesa ${number}`}
      >
        <Text style={styles.number}>{number}</Text>
      </TouchableOpacity>
      {showBadge && <TableCardBadge />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '23%',
    maxWidth: 76,
    marginBottom: 13,
    position: 'relative',
  },
  card: {
    width: '23%',
    aspectRatio: 0.76,
    maxWidth: 76,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  number: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.cardText,
  },
});
