import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function InfoRow({ icon, label }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.infoText} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 4,
  },
  icon: {
    width: 20,
    marginRight: 8,
    opacity: 0.7,
  },
  label: {
    fontSize: 12,
    color: colors.infoText,
    lineHeight: 15,
  },
});
