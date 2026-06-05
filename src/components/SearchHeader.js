import React from 'react';
import { View, TextInput, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

import BaseHeader from './BaseHeader';
import { colors, radii } from '../theme';

export default function SearchHeader({
  onBack,
  value,
  onChangeText,
  onSubmit,
  onFilter,
  activeFilters = 0,
}) {
  return (
    <BaseHeader
      left={
        onBack ? (
          <Pressable onPress={onBack} style={styles.back}>
            <Feather name="arrow-left" size={30} color="#FFF" />
          </Pressable>
        ) : null
      }
      center={
        <View style={styles.search}>
          <Feather name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder="Nº da comanda, atendente ou identificação..."
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            style={styles.input}
          />
        </View>
      }
      right={
        onFilter && (
          <Pressable onPress={onFilter} style={styles.filterBtn}>
            <Feather name="sliders" size={24} color="#FFF" />

            {activeFilters > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilters}</Text>
              </View>
            )}
          </Pressable>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  back: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    flex: 1,
    backgroundColor: '#3A3636',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    marginLeft: 8,
  },

  filterBtn: {
    width: 54,
    height: 54,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },

  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
  },

  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});