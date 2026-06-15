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
  placeholder = 'Nº da comanda, atendente ou identificação...',
}) {
  return (
    <BaseHeader
      left={
        onBack ? (
          <Pressable onPress={onBack} style={styles.back}>
            <Feather name="arrow-left" size={42} color="#FFF" />
          </Pressable>
        ) : null
      }
      center={
        <View style={styles.search}>
          <Feather name="search" size={26} color={colors.textMuted} />
          <TextInput
            placeholder={placeholder}
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
            <Feather name="sliders" size={30} color="#FFF" />

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
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    flex: 1,
    backgroundColor: colors.bgDarkSoft,
    borderRadius: 12,
    paddingHorizontal: 22,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 22,
    lineHeight: 28,
    marginLeft: 12,
  },

  filterBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
