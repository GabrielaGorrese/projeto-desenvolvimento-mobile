import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

export default function BottomBar({ current = 'home' }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isManager } = useAuth();
  const { width } = useWindowDimensions();
  const scale = width / 375;

  function go(name) {
    if (name === current) return;
    if (name === 'home') navigation.navigate('Orders');
    if (name === 'catalog') navigation.navigate('Products');
  }

  const Item = ({ name, icon, disabled = false }) => {
    const active = current === name;
    const iconColor = disabled ? '#5F5F5F' : active ? colors.primary : '#B8B8B8';
    return (
      <Pressable
        onPress={() => go(name)}
        style={styles.item}
        disabled={disabled}
        hitSlop={8}
        android_ripple={disabled ? null : { color: 'rgba(255,255,255,0.14)', borderless: true, radius: 28 * scale }}
      >
        <Feather name={icon} size={20 * scale} color={iconColor} />
        {active && !disabled ? (
          <View
            style={[
              styles.dot,
              {
                width: 6 * scale,
                height: 6 * scale,
                borderRadius: 3 * scale,
                marginTop: 4 * scale,
              }
            ]}
          />
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <View
        style={[
          styles.inner,
          {
            height: 72 * scale,
            paddingHorizontal: 46 * scale,
          }
        ]}
      >
        <Item name="home" icon="home" />
        <View style={{ width: 104 * scale }} pointerEvents="none" />
        <Item name="catalog" icon="grid" disabled={!isManager} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.bgDark,
    backgroundColor: colors.bgDark,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: colors.primary,
  },
});