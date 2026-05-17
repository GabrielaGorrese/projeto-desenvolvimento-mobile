import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function SearchBar({
  placeholder = 'Número da comanda...',
  value,
  onChangeText,
}) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.placeholder} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.searchBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    padding: 0,
  },
});
