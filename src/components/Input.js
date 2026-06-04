import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
    inputStyle,
    fieldStyle,
    labelStyle,
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
  const isPassword = !!secureTextEntry;
  const obscured   = isPassword && !showPwd;

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && { height: 'auto', minHeight: 92, paddingVertical: 10 },
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
          style={[styles.input, multiline && { textAlignVertical: 'top' }, inputStyle]}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={8}>
            <Feather name={showPwd ? 'eye' : 'eye-off'} size={18} color={colors.textMuted} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { ...typography.bodyBold, color: colors.textDark, marginBottom: 6, fontSize: 15 },
  field: {
    height: 46,
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: colors.textDark, fontSize: 15, padding: 0 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
});

export default Input;
