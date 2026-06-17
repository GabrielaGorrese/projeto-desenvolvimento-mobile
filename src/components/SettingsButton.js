import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

export default function SettingsButton({ navigation }) {
  const insets = useSafeAreaInsets();
  const r = useResponsive();

  const minSide = Math.min(r.width, r.height);

  const buttonSize = Math.round(Math.max(40, Math.min(64, minSide * 0.07)));
  const iconSize = Math.round(Math.max(22, Math.min(40, minSide * 0.045)));

  const offset = scaleSize(36, minSide);

  return (
    <Pressable
      onPress={() => navigation.navigate('ApiConfig')}
      hitSlop={scaleSize(12, minSide)}
      style={[
        styles.gear,
        {
          top: insets.top + offset,
          right: insets.right + offset,
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
      ]}
      android_ripple={{
        color: 'rgba(255,255,255,0.2)',
        borderless: true,
        radius: buttonSize * 0.6,
      }}
    >
      <Feather name="settings" size={iconSize} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gear: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',

    ...Platform.select({
      ios: {
        opacity: 0.95,
      },
    }),
  },
});