import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, radii } from '../theme';

// FAB posicionado de forma a sempre ficar visível, considerando:
//  - insets.bottom (gesture/home indicator)
//  - aboveBottomBar={true} adiciona 56dp para não sobrepor a BottomBar
export default function Fab({ onPress, icon = 'plus', style, aboveBottomBar = true }) {
  const insets = useSafeAreaInsets();
  const bottomBarHeight = aboveBottomBar ? 56 : 0;
  // 18dp de respiro acima da BottomBar + altura da bottombar + safe area
  const bottom = 18 + bottomBarHeight + insets.bottom;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 32 }}
      style={[styles.fab, shadow.fab, { bottom }, style]}
    >
      <Feather name={icon} size={28} color="#FFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
});
