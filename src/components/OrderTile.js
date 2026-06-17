import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

export default function OrderTile({ order, onPress, isNew, partial }) {
  const { width } = useWindowDimensions();
  const scale = width / 375;

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
    <View style={[styles.wrap, { margin: 4 * scale }]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
        style={({ pressed }) => [
          styles.tile,
          {
            backgroundColor: bg,
            width: 58 * scale,
            height: 90 * scale,
            borderRadius: radii.md * scale,
            marginTop: 12 * scale,
          },
          isClosed && { opacity: 0.7 },
          pressed && { opacity: isClosed ? 0.55 : 0.85 },
        ]}
      >
        <Text
          style={[
            styles.num,
            {
              fontSize: 22 * scale,
              paddingHorizontal: 6 * scale,
            },
            isClosed && { color: '#9C8E84' }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {label}
        </Text>
      </Pressable>

      {isNew ? (
        <View style={[styles.star, { top: -8 * scale, right: -6 * scale }]}>
          <Feather name="star" size={18 * scale} color="#E8C44E" />
        </View>
      ) : null}

      {partial ? (
        <View
          style={[
            styles.partial,
            {
              bottom: 6 * scale,
              left: 6 * scale,
              right: 6 * scale,
              borderRadius: 6 * scale,
              paddingVertical: 2 * scale,
            }
          ]}
        >
          <Text style={[styles.partialText, { fontSize: 10 * scale }]}>
            PARCIAL
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  num: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '900',
    width: '100%',
    textAlign: 'center',
  },
  star: {
    position: 'absolute',
  },
  partial: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
  },
  partialText: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});