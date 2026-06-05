import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

const VARIANTS = {
  primary: { header: colors.primary, icon: 'help-circle',    accent: colors.primary, lightHeader: false },
  danger:  { header: colors.danger,  icon: 'alert-triangle', accent: colors.danger,  lightHeader: false },
  warning: { header: colors.warning, icon: 'alert-triangle', accent: colors.warning, lightHeader: true  },
};

export default function ConfirmModal({
  visible,
  title,
  message,
  variant = 'primary',
  icon,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,   
  loading = false,
  onConfirm,
  onCancel,
  size = 'md',
}) {
  const { width, height } = useWindowDimensions();
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isLarge = size === 'lg';


  const boxMaxWidth = Math.min(380, width - 48);

  const boxMaxHeight = Math.round(height * 0.88);

  const headerTitleColor = v.lightHeader ? colors.textDark : '#FFF';
  const confirmBg = destructive ? colors.danger : v.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.box, { maxWidth: boxMaxWidth, maxHeight: boxMaxHeight }]}>
          <View style={[styles.header, { backgroundColor: v.header }]}>
            <Text style={[styles.headerTitle, isLarge && styles.headerTitleLarge, { color: headerTitleColor }]} numberOfLines={2}>
              {title}
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.body, isLarge && styles.bodyLarge]}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <Feather name={icon || v.icon} size={isLarge ? 46 : 40} color={v.accent} style={{ marginBottom: 12 }} />
            {typeof message === 'string'
              ? <Text style={[styles.message, isLarge && styles.messageLarge]}>{message}</Text>
              : message}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={({ pressed }) => [styles.btn, isLarge && styles.btnLarge, styles.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.cancelLabel, isLarge && styles.cancelLabelLarge]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={({ pressed }) => [
                styles.btn,
                isLarge && styles.btnLarge,
                { backgroundColor: confirmBg },
                pressed && { opacity: 0.85 },
                loading && { opacity: 0.8 },
              ]}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.confirmLabel}>{confirmLabel}</Text>}
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
  box: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  header: { paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, fontSize: 18, textAlign: 'center' },
  headerTitleLarge: { fontSize: 20 },
  scroll: { flexShrink: 1 },
  body: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18, alignItems: 'center' },
  bodyLarge: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  message: { ...typography.body, color: colors.textDark, textAlign: 'center', fontSize: 15 },
  messageLarge: { fontSize: 16 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 4,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnLarge: { height: 52 },
  cancelBtn: { backgroundColor: colors.inputBg },
  cancelLabel: { color: colors.textDark, fontWeight: '700', fontSize: 15 },
  cancelLabelLarge: { fontSize: 16 },
  confirmLabel: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
