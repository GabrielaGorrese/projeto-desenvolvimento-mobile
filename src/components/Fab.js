import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, radii } from '../theme';

export default function Fab({ onPress, icon = 'plus', style, aboveBottomBar = true, centeredOnBottomBar = false }) {
  const insets = useSafeAreaInsets();
  const bottomBarHeight = aboveBottomBar ? 56 : 0;
  const bottom = centeredOnBottomBar ? 60 + insets.bottom : 18 + bottomBarHeight + insets.bottom;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 32 }}
      style={[styles.fab, shadow.fab, { bottom }, centeredOnBottomBar && styles.centeredOnBottomBar, style]}
    >
      <Feather name={icon} size={40} color="#FFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 72,
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  centeredOnBottomBar: {
    left: '50%',
    right: undefined,
    marginLeft: -36,
  },
});
