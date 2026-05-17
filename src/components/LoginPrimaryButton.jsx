import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function LoginPrimaryButton({
  label = 'ENTRAR',
  onPress,
  loading = false,
  disabled = false,
  style,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        style,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    width: loginLayout.enterButtonWidth,
    height: loginLayout.enterButtonHeight,
    backgroundColor: colors.accent,
    borderRadius: loginLayout.enterButtonRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: loginLayout.labelFontSize,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
});
