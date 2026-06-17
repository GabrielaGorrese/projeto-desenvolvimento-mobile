import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, radii } from '../theme';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

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
  const r = useResponsive();
  const minSide = Math.min(r.width, r.height);

  const styles = makeStyles(variant, size, disabled, minSide);

  const rippleColor =
    variant === 'outline' || variant === 'ghost'
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
        pressed && !disabled && Platform.OS !== 'android' && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={styles.label.color} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: styles.iconGap }}>{icon}</View> : null}
          <Text style={[styles.label, textStyle]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function makeStyles(variant, size, disabled, minSide) {
  const baseHeights = { sm: 40, md: 50, lg: 56 };
  const baseRadius = { sm: radii.md, md: radii.md, lg: radii.lg };
  const baseFontSizes = { sm: 13, md: 15, lg: 17 };

  const height = Math.round(
    Math.max(36, Math.min(64, baseHeights[size] * (minSide / REF_MIN_SIDE)))
  );

  const borderRadius = Math.round(
    Math.max(8, Math.min(20, baseRadius[size] * (minSide / REF_MIN_SIDE)))
  );

  const fontSize = Math.round(
    Math.max(12, Math.min(20, baseFontSizes[size] * (minSide / REF_MIN_SIDE)))
  );

  const paddingHorizontal = scaleSize(16, minSide);
  const iconGap = scaleSize(8, minSide);

  let bg = colors.primary;
  let border = 'transparent';
  let color = colors.textOnPrimary;

  if (variant === 'outline') {
    bg = 'transparent';
    border = colors.primary;
    color = colors.primary;
  } else if (variant === 'ghost') {
    bg = colors.inputBg;
    color = colors.textDark;
  } else if (variant === 'danger') {
    bg = colors.danger;
    color = '#FFF';
  }

  if (disabled) {
    bg = variant === 'outline' ? 'transparent' : '#CCCCCC';
    color = '#888';
    border = variant === 'outline' ? '#CCC' : 'transparent';
  }

  return StyleSheet.create({
    btn: {
      height,
      borderRadius,
      backgroundColor: bg,
      borderWidth: variant === 'outline' ? 2 : 0,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      ...typography.button,
      color,
      fontSize,
    },
    iconGap,
  });
}