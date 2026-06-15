import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, radii } from '../theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',      
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
  size = 'md',           
}) {
  const styles = makeStyles(variant, size, disabled);
  // Ripple ajusta-se ao fundo: claro em variants escuros, escuro em variants claros
  const rippleColor = variant === 'outline' || variant === 'ghost'
    ? 'rgba(0,0,0,0.12)'
    : 'rgba(255,255,255,0.25)';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: rippleColor, borderless: false }}
      style={({ pressed }) => [
        styles.btn,
        fullWidth && { alignSelf: 'stretch' },
        // No iOS, ripple não existe — usamos opacity como feedback equivalente.
        pressed && !disabled && Platform.OS !== 'android' && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={styles.label.color} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
          <Text style={[styles.label, textStyle]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function makeStyles(variant, size, disabled) {
  const heights = { sm: 40, md: 50, lg: 56 };
  const radius  = { sm: radii.md, md: radii.md, lg: radii.lg };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  let bg     = colors.primary;
  let border = 'transparent';
  let color  = colors.textOnPrimary;

  if (variant === 'outline') {
    bg     = 'transparent';
    border = colors.primary;
    color  = colors.primary;
  } else if (variant === 'ghost') {
    bg     = colors.inputBg;
    color  = colors.textDark;
  } else if (variant === 'danger') {
    bg     = colors.danger;
    color  = '#FFF';
  }

  if (disabled) {
    bg = variant === 'outline' ? 'transparent' : '#CCCCCC';
    color = '#888';
    border = variant === 'outline' ? '#CCC' : 'transparent';
  }

  return StyleSheet.create({
    btn: {
      height: heights[size],
      borderRadius: radius[size],
      backgroundColor: bg,
      borderWidth: variant === 'outline' ? 2 : 0,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      overflow: 'hidden', // ripple respeita o border-radius
    },
    row:   { flexDirection: 'row', alignItems: 'center' },
    label: { ...typography.button, color, fontSize: 20 },
  });
}
