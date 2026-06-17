import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, radii } from '../theme';

export default function Fab({ onPress, icon = 'plus', style, aboveBottomBar = true, centeredOnBottomBar = false }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = width / 375;

  const bottomBarHeight = aboveBottomBar ? 56 * scale : 0;
  const bottom = centeredOnBottomBar
    ? 60 * scale + insets.bottom
    : 18 * scale + bottomBarHeight + insets.bottom;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 32 * scale }}
      style={[
        styles.fab,
        shadow.fab,
        {
          bottom,
          right: centeredOnBottomBar ? undefined : 72 * scale,
          width: 96 * scale,
          height: 96 * scale,
          borderRadius: 18 * scale,
        },
        centeredOnBottomBar && {
          left: '50%',
          marginLeft: -48 * scale,
        },
        style
      ]}
    >
      <Feather name={icon} size={40 * scale} color="#FFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});