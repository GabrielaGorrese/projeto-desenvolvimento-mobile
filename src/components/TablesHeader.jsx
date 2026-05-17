import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';
import { colors } from '../theme/colors';

export default function TablesHeader({
  searchValue,
  onSearchChange,
  onBackPress,
  onFilterPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.headerStart, colors.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <SearchBar value={searchValue} onChangeText={onSearchChange} />
          <FilterButton onPress={onFilterPress} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
