import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, typography } from '../theme';

// Bottom-sheet de filtros. Recebe `sections` (lista de seções com opções)
// e devolve a opção selecionada via onChange por chave.
//
// Exemplo de uso:
//   <FiltersSheet
//     visible={...}
//     onClose={...}
//     onClear={() => { ...zera todos os filtros }}
//     sections={[
//       {
//         key: 'status',
//         title: 'Status',
//         value: status,                              // valor atual
//         options: [
//           { value: 'all',  label: 'Todas' },
//           { value: 'open', label: 'Abertas' },
//         ],
//         onChange: setStatus,
//       },
//       ...
//     ]}
//   />
export default function FiltersSheet({ visible, onClose, onClear, sections = [], size = 'md' }) {
  const insets = useSafeAreaInsets();
  const isLarge = size === 'lg';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, isLarge && styles.sheetLarge, { paddingBottom: insets.bottom + (isLarge ? 28 : 20) }]} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, isLarge && styles.titleLarge]}>Filtros</Text>
            <View style={{ flex: 1 }} />
            {onClear ? (
              <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
                <Text style={[styles.clearTxt, isLarge && styles.clearTxtLarge]}>Limpar</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Feather name="x" size={isLarge ? 38 : 32} color={colors.textDark} />
            </Pressable>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: '#ccc',
              width: '100%',
              marginVertical: 10,
            }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, isLarge && styles.scrollContentLarge]}>
            {sections.map((sec) => (
              <View key={sec.key} style={styles.section}>
                <Text style={[styles.sectionTitle, isLarge && styles.sectionTitleLarge]}>{sec.title}</Text>
                <View style={styles.chipsRow}>
                  {sec.options.map((opt) => {
                    const active = sec.value === opt.value;
                    return (
                      <Pressable
                        key={String(opt.value ?? 'null')}
                        onPress={() => sec.onChange(opt.value)}
                        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                        style={[
                          styles.chip,
                          isLarge && styles.chipLarge,
                          active && { backgroundColor: opt.color || colors.primary, borderColor: opt.color || colors.primary },
                        ]}
                      >
                        {opt.dot ? (
                          <View style={[styles.dot, isLarge && styles.dotLarge, { backgroundColor: opt.dot }]} />
                        ) : null}
                          <Text style={[styles.chipText, isLarge && styles.chipTextLarge, active && { color: '#FFF', fontWeight: '700' }]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 26,
    paddingTop: 10,
    maxHeight: '85%'
  },
  sheetLarge: {
    paddingHorizontal: 30,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6D2CD',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
    minHeight: 54,
  },
  title:    { ...typography.h3, color: colors.textDark, fontSize: 24, lineHeight: 31 },
  titleLarge: { fontSize: 30, lineHeight: 38 },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  clearTxt: { color: colors.primary, fontWeight: '700', fontSize: 20, lineHeight: 26, marginRight: 8 },
  clearTxtLarge: { fontSize: 24, lineHeight: 31 },
  closeBtn: { padding: 8, marginLeft: 4 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 8 },
  scrollContentLarge: { paddingHorizontal: 24, paddingBottom: 12 },

  section: { marginTop: 18, marginBottom: 10 },
  sectionTitle: { ...typography.bodyBold, color: colors.textDark, marginBottom: 12, fontSize: 22, lineHeight: 29 },
  sectionTitleLarge: { fontSize: 26, lineHeight: 34 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: '#FFF',
    marginRight: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  chipLarge: {
    minHeight: 60,
    paddingHorizontal: 22,
    paddingVertical: 15,
    marginRight: 12,
    marginBottom: 12,
  },
  chipText: { color: colors.textDark, fontSize: 19, lineHeight: 25 },
  chipTextLarge: { fontSize: 23, lineHeight: 30 },
  dot:      { width: 13, height: 13, borderRadius: 7, marginRight: 10 },
  dotLarge: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
});
