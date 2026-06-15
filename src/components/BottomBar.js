import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

// Tabbar inferior. Navega sozinha (useNavigation), então as telas só informam
// qual item está ativo via `current`. O item de catálogo (gerenciar produtos)
// fica clicavel apenas para gerentes.
//   current: 'home' (comandas) | 'catalog' (produtos)
export default function BottomBar({ current = 'home' }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isManager } = useAuth();

  function go(name) {
    if (name === current) return;
    if (name === 'home')    navigation.navigate('Orders');
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
        android_ripple={disabled ? null : { color: 'rgba(255,255,255,0.14)', borderless: true, radius: 28 }}
      >
        <Feather name={icon} size={36} color={iconColor} />
        {active && !disabled ? <View style={styles.dot} /> : null}
      </Pressable>
    );
  };


  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        <Item name="home" icon="home" />
        <View style={styles.fabGap} pointerEvents="none" />
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
    height: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 46,
  },
  item:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabGap: { width: 104 },
  dot:   { width: 6, height: 6, borderRadius: 3, marginTop: 4, backgroundColor: colors.primary },
});
