import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';

// Cabeçalho escuro compartilhado (OrdersScreen, OrderDetailScreen, CatalogScreen).
// Modo busca: seta voltar + campo de busca + filtro opcional.
// Modo título: seta voltar + faixa central com título/subtítulo (+ slot à direita opcional).
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
  enlarged = false,
  title,
  subtitle,
  right,
  titlePlain = false,
}) {
  const insets = useSafeAreaInsets();
  const titleMode = !!title;

  return (
    <View
      style={[
        styles.wrap,
        titleMode && titlePlain && styles.wrapTitlePlain,
        { paddingTop: insets.top + 10 },
      ]}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={[styles.back, titleMode && titlePlain && styles.backTitlePlain]}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 18 }}
        >
          <Feather name="arrow-left" size={enlarged ? 26 : 22} color="#FFF" />
        </Pressable>
      ) : <View style={{ width: 32 }} />}

      {titleMode && titlePlain ? (
        <View style={[styles.titlePlainBox, enlarged && styles.titlePlainBoxEnlarged]}>
          <Text style={[styles.titlePlainText, enlarged && styles.titlePlainTextEnlarged]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitlePlainText, enlarged && styles.subtitlePlainTextEnlarged]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : titleMode ? (
        <View style={[styles.search, styles.titleBox, enlarged && styles.searchEnlarged]}>
          <Text style={[styles.titleText, enlarged && styles.titleTextEnlarged]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitleText, enlarged && styles.subtitleTextEnlarged]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.search, enlarged && styles.searchEnlarged]}>
          <Feather name="search" size={enlarged ? 18 : 16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            style={[styles.searchInput, enlarged && styles.searchInputEnlarged]}
          />
          {value ? (
            <Pressable onPress={() => onChangeText('')} hitSlop={8}>
              <Feather name="x-circle" size={enlarged ? 18 : 16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      )}

      {titleMode && !titlePlain ? (
        right || <View style={[styles.sideSlot, enlarged && styles.sideSlotEnlarged]} />
      ) : titleMode && titlePlain ? (
        right || null
      ) : onFilter ? (
        <Pressable
          onPress={onFilter}
          hitSlop={8}
          style={[styles.filterBtn, enlarged && styles.filterBtnEnlarged]}
          android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
        >
          <Feather name="sliders" size={enlarged ? 22 : 18} color="#FFF" />
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
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrapTitlePlain: {
    alignItems: 'flex-start',
    paddingBottom: 8,
  },
  back: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  backTitlePlain: { marginTop: 2 },
  titlePlainBox: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  titlePlainBoxEnlarged: { paddingVertical: 4 },
  titlePlainText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'left',
  },
  titlePlainTextEnlarged: { fontSize: 16 },
  subtitlePlainText: {
    color: '#B8B4B4',
    fontSize: 13,
    marginTop: 0,
    textAlign: 'left',
  },
  subtitlePlainTextEnlarged: { fontSize: 12, marginTop: 2 },
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
  searchEnlarged: { height: 44, paddingHorizontal: 14 },
  searchInputEnlarged: { fontSize: 16 },
  titleBox: {
    justifyContent: 'center',
    paddingVertical: 6,
  },
  titleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  titleTextEnlarged: { fontSize: 18 },
  subtitleText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  subtitleTextEnlarged: { fontSize: 14 },
  sideSlot: { width: 38, height: 38 },
  sideSlotEnlarged: { width: 44, height: 44 },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filterBtnEnlarged: { width: 44, height: 44 },
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
