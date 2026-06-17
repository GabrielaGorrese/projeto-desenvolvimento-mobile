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
  primary: { header: colors.primary, icon: 'help-circle', accent: colors.primary, lightHeader: false },
  danger: { header: colors.danger, icon: 'alert-triangle', accent: colors.danger, lightHeader: false },
  warning: { header: colors.warning, icon: 'alert-triangle', accent: colors.warning, lightHeader: true },
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
  const scale = width / 375;

  const v = VARIANTS[variant] || VARIANTS.primary;
  const isLarge = size === 'lg';

  const boxMaxWidth = Math.min(380 * scale, width - 48 * scale);
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
      <View style={[styles.overlay, { padding: 24 * scale }]}>
        <View
          style={[
            styles.box,
            {
              maxWidth: boxMaxWidth,
              maxHeight: boxMaxHeight,
              borderRadius: radii.lg * scale,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: v.header,
                paddingVertical: 14 * scale,
                paddingHorizontal: 16 * scale,
              },
            ]}
          >
            <Text
              style={[
                styles.headerTitle,
                {
                  fontSize: (isLarge ? 20 : 18) * scale,
                },
                { color: headerTitleColor },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.body,
              {
                paddingHorizontal: (isLarge ? 24 : 22) * scale,
                paddingTop: (isLarge ? 24 : 22) * scale,
                paddingBottom: (isLarge ? 20 : 18) * scale,
              },
            ]}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <Feather
              name={icon || v.icon}
              size={(isLarge ? 46 : 40) * scale}
              color={v.accent}
              style={{ marginBottom: 12 * scale }}
            />
            {typeof message === 'string' ? (
              <Text
                style={[
                  styles.message,
                  {
                    fontSize: (isLarge ? 16 : 15) * scale,
                  },
                ]}
              >
                {message}
              </Text>
            ) : (
              message
            )}
          </ScrollView>

          <View
            style={[
              styles.actions,
              {
                paddingHorizontal: 18 * scale,
                paddingBottom: 18 * scale,
                paddingTop: 4 * scale,
                gap: 10 * scale,
              },
            ]}
          >
            <Pressable
              onPress={onCancel}
              disabled={loading}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={({ pressed }) => [
                styles.btn,
                {
                  height: (isLarge ? 52 : 48) * scale,
                  borderRadius: radii.md * scale,
                },
                styles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.cancelLabel,
                  {
                    fontSize: (isLarge ? 16 : 15) * scale,
                  },
                ]}
              >
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={({ pressed }) => [
                styles.btn,
                {
                  height: (isLarge ? 52 : 48) * scale,
                  borderRadius: radii.md * scale,
                  backgroundColor: confirmBg,
                },
                pressed && { opacity: 0.85 },
                loading && { opacity: 0.8 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.confirmLabel, { fontSize: 15 * scale }]}>
                  {confirmLabel}
                </Text>
              )}
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
  },
  box: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    textAlign: 'center',
  },
  scroll: {
    flexShrink: 1,
  },
  body: {
    alignItems: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textDark,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cancelBtn: {
    backgroundColor: colors.inputBg,
  },
  cancelLabel: {
    color: colors.textDark,
    fontWeight: '700',
  },
  confirmLabel: {
    color: '#FFF',
    fontWeight: '700',
  },
});