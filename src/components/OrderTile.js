import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

// Card numerado verde/amarelo/vermelho (abertas) ou cinza (fechadas).
// Mostra o número visível da comanda (daily_number, reinicia ao fechar o caixa).
// Cai no id como fallback para comandas antigas sem daily_number.
export default function OrderTile({ order, onPress, isNew, partial }) {
  const bg = order.status === 'closed'
    ? colors.statusClosed
    : order.color_status === 'red'
      ? colors.statusRed
      : order.color_status === 'yellow'
        ? colors.statusYellow
        : colors.statusGreen;

  const isClosed = order.status === 'closed';
  const label = String(order.daily_number ?? order.id).padStart(2, '0');

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: bg },
          isClosed && { opacity: 0.7 },
          pressed && { opacity: isClosed ? 0.55 : 0.85 },
        ]}
      >
        <Text
          style={[styles.num, isClosed && { color: '#9C8E84' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {label}
        </Text>
      </Pressable>
      {isNew ? (
        <View style={styles.star}>
          <Feather name="star" size={18} color="#E8C44E" />
        </View>
      ) : null}
      {partial ? (
        <View style={styles.partial}>
          <Text style={styles.partialText}>PARCIAL</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { margin: 6 },
  tile:  {
    width: 96,
    height: 128,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',  // ripple respeita o border-radius
  },

  num: { ...typography.h2, color: '#FFFFFF', fontWeight: '900', fontSize: 32, width: '100%', textAlign: 'center', paddingHorizontal: 6 },
  star: { position: 'absolute', top: -8, right: -6 },

  // Faixa "PARCIAL": comanda que está em Pendentes e Entregues ao mesmo tempo.
  partial: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  partialText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
