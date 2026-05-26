import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';

// Cabeçalho com seta voltar + busca + botão filtro. Absorve o inset top
// da status bar (paddingTop dinâmico).
//
// `activeFilters` (número) — se > 0, exibe um badge sobre o ícone de filtro.
export default function SearchHeader({
  onBack,
  placeholder = 'Buscar...',
  value,
  onChangeText,
  onSubmit,
  onFilter,
  activeFilters = 0,
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={styles.back}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 18 }}
        >
          <Feather name="arrow-left" size={22} color="#FFF" />
        </Pressable>
      ) : <View style={{ width: 32 }} />}

      <View style={styles.search}>
        <Feather name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          style={styles.searchInput}
        />
        {value ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Feather name="x-circle" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {onFilter ? (
        <Pressable
          onPress={onFilter}
          hitSlop={8}
          style={styles.filterBtn}
          android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
        >
          <Feather name="sliders" size={18} color="#FFF" />
          {activeFilters > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilters}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  back: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  search: {
    flex: 1,
    backgroundColor: '#3A3636',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14, padding: 0 },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgDark,
  },
  badgeText: { color: '#FFF', fontWeight: '800', fontSize: 10 },
});
