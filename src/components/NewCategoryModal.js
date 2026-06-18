import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

export default function NewCategoryModal({
  visible,
  value,
  onChangeText,
  onConfirm,
  onCancel,
  loading = false,
  error,
}) {
  const { width } = useWindowDimensions();
  const boxMaxWidth = Math.min(440, width - 40);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? undefined : onCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.box, { maxWidth: boxMaxWidth }]}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Feather name="grid" size={20} color="#FFF" />
            </View>
            <Text style={styles.headerTitle}>Nova categoria</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>Nome da categoria</Text>
            <View style={[styles.field, error && { borderColor: colors.danger }]}>
              <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder='Ex.: "Sobremesas", "Porções"'
                placeholderTextColor={colors.textMuted}
                autoCapitalize="sentences"
                autoFocus
                maxLength={100}
                returnKeyType="done"
                onSubmitEditing={onConfirm}
                style={styles.input}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={({ pressed }) => [styles.btn, styles.confirmBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.8 }]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFF" />
                  <Text style={styles.confirmLabel}>Criar</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.title, color: '#FFF', fontSize: 20 },

  body: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 6 },
  label: { ...typography.bodyBold, color: colors.textDark, marginBottom: 8, fontSize: 15 },
  field: {
    height: 54,
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: { flex: 1, color: colors.textDark, fontSize: 17, padding: 0 },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },

  actions: { flexDirection: 'row', gap: 10, padding: 18 },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  cancelBtn: { backgroundColor: colors.inputBg },
  cancelLabel: { color: colors.textDark, fontWeight: '700', fontSize: 16 },
  confirmBtn: { backgroundColor: colors.primary },
  confirmLabel: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
