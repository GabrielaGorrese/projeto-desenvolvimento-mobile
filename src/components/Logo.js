import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';


export default function Logo({ size = 'lg', subtitle = 'Boas-vindas!' }) {
  const fontSize = size === 'lg' ? 38 : size === 'md' ? 28 : 22;
  const iconSize = size === 'lg' ? 36 : size === 'md' ? 28 : 22;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.brand, { fontSize }]}>COMANDOU</Text>
        <View style={styles.icon}>
          <Feather name="check" size={iconSize * 0.65} color={colors.primary} style={{ position: 'absolute', top: -2 }} />
          <View style={[styles.bowl, { width: iconSize * 1.2, height: iconSize * 0.6 }]} />
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { alignItems: 'center' },
  row:   { flexDirection: 'row', alignItems: 'center' },
  brand: {
    color: colors.primary,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  icon:  {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bowl: {
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderWidth: 3,
    borderColor: colors.primary,
    borderTopWidth: 0,
    marginTop: 6,
  },
  subtitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 6,
    fontSize: 14,
  },
});
