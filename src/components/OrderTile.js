import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

// Card numerado verde/amarelo/vermelho (abertas) ou cinza (fechadas).
// Mostra o "número da comanda" — id formatado com 2 dígitos.
export default function OrderTile({ order, onPress, isNew, size = 'md' }) {
  const large = size === 'lg';
  const bg = order.status === 'closed'
    ? colors.statusClosed
    : order.color_status === 'red'
      ? colors.statusRed
      : order.color_status === 'yellow'
        ? colors.statusYellow
        : colors.statusGreen;

  const isClosed = order.status === 'closed';
  const label = String(order.id).padStart(2, '0');

  return (
    <View style={[styles.wrap, large && styles.wrapLg]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
        style={({ pressed }) => [
          styles.tile,
          large && styles.tileLg,
          { backgroundColor: bg },
          isClosed && { opacity: 0.7 },
          pressed && { opacity: isClosed ? 0.55 : 0.85 },
        ]}
      >
        <Text style={[styles.num, large && styles.numLg, isClosed && { color: '#9C8E84' }]}>{label}</Text>
      </Pressable>
      {isNew ? (
        <View style={[styles.star, large && styles.starLg]}>
          <Feather name="star" size={large ? 22 : 18} color="#E8C44E" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { margin: 6 },
  wrapLg: { margin: 8 },
  tile:  {
    width: 78,
    height: 96,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',  // ripple respeita o border-radius
  },
  tileLg: {
    width: 96,
    height: 118,
    borderRadius: radii.lg,
  },
  num: { ...typography.h2, color: '#FFFFFF', fontWeight: '900', fontSize: 26 },
  numLg: { fontSize: 32 },
  star: { position: 'absolute', top: -8, right: -6 },
  starLg: { top: -10, right: -8 },
});
