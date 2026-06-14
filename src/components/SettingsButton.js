import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsButton({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => navigation.navigate('ApiConfig')}
      hitSlop={12}
      style={[
        styles.gear,
        {
          top: insets.top + 36,
          right: insets.right + 36,
        },
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 22 }}
    >
      <Feather name="settings" size={40} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gear: {
    position: 'absolute',
    zIndex: 2,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});