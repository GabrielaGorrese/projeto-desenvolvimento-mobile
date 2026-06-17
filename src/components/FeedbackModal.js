import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, typography } from '../theme';
import useResponsive from '../hooks/useResponsive';

export default function FeedbackModal({
  visible,
  title = 'Pedido cadastrado',
  message,
  variant = 'success',
  onClose,
  okLabel = 'OK',
  size = 'md',
}) {
  const insets = useSafeAreaInsets();
  const { wp, hp, isTablet } = useResponsive();

  const headerBg = variant === 'danger' ? colors.danger : colors.primary;
  const iconName = variant === 'danger' ? 'x-circle' : 'check-circle';
  const iconColor = variant === 'danger' ? colors.danger : '#3AAE3A';
  const isLarge = size === 'lg' || isTablet;

  const iconSize = isLarge ? wp(10) : wp(12);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[styles.box, { maxWidth: isTablet ? wp(60) : wp(90) }]}>
          <View style={[styles.header, { backgroundColor: headerBg, paddingVertical: hp(2.2) }]}>
            <Text style={[styles.headerTitle, { fontSize: isLarge ? wp(3.2) : wp(4) }]}>
              {title}
            </Text>
          </View>

          <View
            style={[
              styles.body,
              {
                paddingHorizontal: wp(6),
                paddingTop: hp(3),
                paddingBottom: hp(3),
              },
            ]}
          >
            <Feather name={iconName} size={iconSize} color={iconColor} style={{ marginBottom: hp(2) }} />

            {typeof message === 'string' ? (
              <Text
                style={[
                  styles.message,
                  {
                    fontSize: isLarge ? wp(2.6) : wp(3.6),
                    lineHeight: isLarge ? wp(3.6) : wp(5),
                    marginBottom: hp(2.5),
                  },
                ]}
              >
                {message}
              </Text>
            ) : (
              message
            )}

            <Pressable
              onPress={onClose}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={({ pressed }) => [
                styles.okBtn,
                {
                  backgroundColor: headerBg,
                  minWidth: wp(40),
                  minHeight: hp(6.5),
                  paddingHorizontal: wp(8),
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.okLabel, { fontSize: isLarge ? wp(2.6) : wp(3.6) }]}>
                {okLabel}
              </Text>
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
    paddingHorizontal: 16,
  },
  box: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    color: '#FFF',
    textAlign: 'center',
  },
  body: {
    alignItems: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textDark,
    textAlign: 'center',
  },
  okBtn: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  okLabel: {
    color: '#FFF',
    fontWeight: '700',
  },
});