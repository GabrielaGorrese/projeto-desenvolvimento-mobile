import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, radii } from '../theme';

const Input = forwardRef(function Input(
  {
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize = 'none',
    style,
    labelStyle,
    fieldStyle,
    inputStyle,
    error,
    rightIcon,
    onRightIconPress,
    multiline = false,
    editable = true,
    ...rest
  },
  ref
) {
  const [showPwd, setShowPwd] = useState(false);
  const { width } = useWindowDimensions();
  const scale = width / 375;

  const isPassword = !!secureTextEntry;
  const obscured   = isPassword && !showPwd;

  return (
    <View style={[styles.wrap, { marginBottom: 14 * scale }, style]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              marginBottom: 6 * scale,
              fontSize: 15 * scale,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            height: multiline ? undefined : 48 * scale,
            minHeight: multiline ? 92 * scale : undefined,
            paddingVertical: multiline ? 10 * scale : 0,
            paddingHorizontal: 16 * scale,
            borderRadius: radii.md * scale,
          },
          error && { borderColor: colors.danger },
          !editable && { backgroundColor: '#EAEAEA' },
          fieldStyle,
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={obscured}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
          style={[
            styles.input,
            {
              fontSize: 16 * scale,
            },
            multiline && { textAlignVertical: 'top' },
            inputStyle,
          ]}
          {...rest}
        />

        {isPassword ? (
          <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={8}>
            <Feather name={showPwd ? 'eye' : 'eye-off'} size={28 * scale} color={colors.textMuted} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          style={[
            styles.error,
            {
              fontSize: 12 * scale,
              marginTop: 4 * scale,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {},
  label: {
    ...typography.bodyBold,
    color: colors.textDark,
  },
  field: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.textDark,
    padding: 0,
  },
  error: {
    color: colors.danger,
  },
});

export default Input;