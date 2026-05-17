import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function FormTextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  style,
}) {
  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: loginLayout.labelFontSize,
    lineHeight: loginLayout.labelLineHeight,
    fontWeight: '600',
    color: colors.sectionTitle,
    marginBottom: loginLayout.labelToInputGap,
  },
  input: {
    height: loginLayout.inputHeight,
    backgroundColor: colors.inputBackground,
    borderRadius: loginLayout.inputRadius,
    paddingHorizontal: loginLayout.formPaddingHorizontal,
    fontSize: loginLayout.labelFontSize * 0.78,
    color: colors.sectionTitle,
  },
});
