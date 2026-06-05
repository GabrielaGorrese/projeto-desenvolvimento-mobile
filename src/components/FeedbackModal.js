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
  size = 'md',
}) {
  const headerBg = variant === 'danger' ? colors.danger : colors.primary;
  const iconName = variant === 'danger' ? 'x-circle' : 'check-circle';
  const iconColor = variant === 'danger' ? colors.danger : '#3AAE3A';
  const isLarge = size === 'lg';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, isLarge && styles.boxLarge]}>
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <Text style={[styles.headerTitle, isLarge && styles.headerTitleLarge]}>{title}</Text>
          </View>
          <View style={[styles.body, isLarge && styles.bodyLarge]}>
            <Feather name={iconName} size={isLarge ? 48 : 42} color={iconColor} style={{ marginBottom: 12 }} />
            {typeof message === 'string'
              ? <Text style={[styles.message, isLarge && styles.messageLarge]}>{message}</Text>
              : message}
            <Pressable onPress={onClose} style={[styles.okBtn, isLarge && styles.okBtnLarge]}>
              <Text style={[styles.okLabel, isLarge && styles.okLabelLarge]}>{okLabel}</Text>
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
  boxLarge: { maxWidth: 390 },
  header:  { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, color: '#FFF', fontSize: 18 },
  headerTitleLarge: { fontSize: 20 },
  body:    { padding: 22, alignItems: 'center' },
  bodyLarge: { padding: 24 },
  message: { ...typography.body, color: colors.textDark, textAlign: 'center', fontSize: 15, marginBottom: 18 },
  messageLarge: { fontSize: 16, marginBottom: 20 },
  okBtn:   {
    backgroundColor: colors.primary,
    paddingHorizontal: 38,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  okBtnLarge: { paddingHorizontal: 44, paddingVertical: 14 },
  okLabel: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  okLabelLarge: { fontSize: 16 },
});
