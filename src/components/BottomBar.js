import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Tabbar visual da home/catálogo. Absorve o inset bottom (gesture bar /
// home indicator) para o último item não ficar tampado.
export default function BottomBar({ current = 'home', onChange }) {
  const insets = useSafeAreaInsets();
  const Item = ({ name, icon }) => {
    const active = current === name;
    return (
      <Pressable
        onPress={() => onChange?.(name)}
        style={styles.item}
        hitSlop={8}
        android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true, radius: 28 }}
      >
        <Feather name={icon} size={22} color={active ? colors.primary : '#7A7A7A'} />
        {active ? <View style={styles.dot} /> : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        <Item name="home" icon="home" />
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
