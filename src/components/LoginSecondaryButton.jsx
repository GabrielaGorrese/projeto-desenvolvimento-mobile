import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function LoginSecondaryButton({ label = 'CADASTRAR', onPress }) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    width: loginLayout.registerButtonWidth,
    height: loginLayout.registerButtonHeight,
    backgroundColor: colors.accent,
    borderRadius: loginLayout.registerButtonRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: loginLayout.labelFontSize * 0.78,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.5,
  },
});
