import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

// Tabbar inferior. Navega sozinha (useNavigation), então as telas só informam
// qual item está ativo via `current`. O item de catálogo (gerenciar produtos)
// aparece apenas para gerentes.
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

  const Item = ({ name, icon }) => {
    const active = current === name;
    return (
      <Pressable
        onPress={() => go(name)}
        style={styles.item}
        hitSlop={8}
        android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true, radius: 28 }}
      >
        <Feather name={icon} size={22} color={active ? colors.primary : '#7A7A7A'} />
        {active ? <View style={styles.dot} /> : null}
      </Pressable>
    );
  };


  const bottomPad = Math.min(insets.bottom, 48);

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.inner}>
        <Item name="home" icon="home" />
        {isManager ? <Item name="catalog" icon="grid" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  inner: { height: 56, flexDirection: 'row' },
  item:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dot:   { width: 6, height: 6, borderRadius: 3, marginTop: 4, backgroundColor: colors.primary },
});
