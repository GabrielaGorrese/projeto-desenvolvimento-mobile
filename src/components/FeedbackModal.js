import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

// Modal centralizado com header colorido + check + botão OK.
// Replica o pop-up "Pedido cadastrado" do Figma.
export default function FeedbackModal({
  visible,
  title = 'Pedido cadastrado',
  message,
  variant = 'success',
  onClose,
  okLabel = 'OK',
}) {
  const headerBg = variant === 'danger' ? colors.danger : colors.primary;
  const iconName = variant === 'danger' ? 'x-circle' : 'check-circle';
  const iconColor = variant === 'danger' ? colors.danger : '#3AAE3A';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          <View style={styles.body}>
            <Feather name={iconName} size={42} color={iconColor} style={{ marginBottom: 12 }} />
            {typeof message === 'string'
              ? <Text style={styles.message}>{message}</Text>
              : message}
            <Pressable onPress={onClose} style={styles.okBtn}>
              <Text style={styles.okLabel}>{okLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box:     { width: '100%', maxWidth: 360, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: '#FFF' },
  header:  { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, color: '#FFF', fontSize: 18 },
  body:    { padding: 22, alignItems: 'center' },
  message: { ...typography.body, color: colors.textDark, textAlign: 'center', fontSize: 15, marginBottom: 18 },
  okBtn:   {
    backgroundColor: colors.primary,
    paddingHorizontal: 38,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  okLabel: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
