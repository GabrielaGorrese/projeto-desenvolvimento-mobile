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
  const iconSize = isLarge ? 68 : 60;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, isLarge && styles.boxLarge]}>
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <Text style={[styles.headerTitle, isLarge && styles.headerTitleLarge]}>{title}</Text>
          </View>
          <View style={[styles.body, isLarge && styles.bodyLarge]}>
            <Feather name={iconName} size={iconSize} color={iconColor} style={styles.icon} />
            {typeof message === 'string'
              ? <Text style={[styles.message, isLarge && styles.messageLarge]}>{message}</Text>
              : message}
            <Pressable
              onPress={onClose}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={({ pressed }) => [
                styles.okBtn,
                isLarge && styles.okBtnLarge,
                { backgroundColor: headerBg },
                pressed && { opacity: 0.85 },
              ]}
            >
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
  box:     { width: '100%', maxWidth: 410, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: '#FFF' },
  boxLarge: { maxWidth: 440 },
  header:  { paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, color: '#FFF', fontSize: 22, textAlign: 'center' },
  headerTitleLarge: { fontSize: 24 },
  body:    { paddingHorizontal: 30, paddingTop: 30, paddingBottom: 28, alignItems: 'center' },
  bodyLarge: { paddingHorizontal: 34, paddingTop: 34, paddingBottom: 32 },
  icon: { marginBottom: 18 },
  message: { ...typography.body, color: colors.textDark, textAlign: 'center', fontSize: 17, lineHeight: 24, marginBottom: 24 },
  messageLarge: { fontSize: 18, lineHeight: 26, marginBottom: 28 },
  okBtn:   {
    minWidth: 156,
    minHeight: 52,
    paddingHorizontal: 42,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  okBtnLarge: { minWidth: 176, minHeight: 58, paddingHorizontal: 48, paddingVertical: 16 },
  okLabel: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  okLabelLarge: { fontSize: 18 },
});
