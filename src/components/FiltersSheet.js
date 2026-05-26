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
export default function FiltersSheet({ visible, onClose, onClear, sections = [] }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <View style={{ flex: 1 }} />
            {onClear ? (
              <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
                <Text style={styles.clearTxt}>Limpar</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.textDark} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {sections.map((sec) => (
              <View key={sec.key} style={styles.section}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
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
                          active && { backgroundColor: opt.color || colors.primary, borderColor: opt.color || colors.primary },
                        ]}
                      >
                        {opt.dot ? (
                          <View style={[styles.dot, { backgroundColor: opt.dot }]} />
                        ) : null}
                        <Text style={[styles.chipText, active && { color: '#FFF', fontWeight: '700' }]}>
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
    paddingHorizontal: 22,
    paddingTop: 8,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D2CD',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title:    { ...typography.h3, color: colors.textDark, fontSize: 18 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  clearTxt: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  closeBtn: { padding: 4, marginLeft: 4 },

  section: { marginTop: 14, marginBottom: 6 },
  sectionTitle: { ...typography.bodyBold, color: colors.textDark, marginBottom: 8, fontSize: 14 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: '#FFF',
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  chipText: { color: colors.textDark, fontSize: 13 },
  dot:      { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
});
