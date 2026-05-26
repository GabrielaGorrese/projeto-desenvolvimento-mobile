import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';

function getGradient(name) {
  const k = (name || '').toLowerCase();
  if (k.includes('refrige'))  return colors.catRefrigerantes;
  if (k.includes('suco'))     return colors.catSucos;
  if (k.includes('prato'))    return colors.catPratos;
  if (k.includes('lanche'))   return colors.catLanches;
  if (k.includes('salgado'))  return colors.catSalgados;
  if (k.includes('doce'))     return colors.catDoces;
  if (k.includes('sobre'))    return colors.catDoces;
  if (k.includes('combo'))    return colors.catCombos;
  if (k.includes('bebida'))   return colors.catRefrigerantes;
  if (k.includes('porc'))     return colors.catSalgados;
  return colors.catDefault;
}

export default function CategoryCard({ category, onPress, style }) {
  const [c1, c2] = useMemo(() => getGradient(category.name), [category.name]);

  return (
    <Pressable onPress={onPress} style={[styles.card, style]}>
      <View style={[styles.bg, { backgroundColor: c1 }]} />
      <View style={[styles.bg, { backgroundColor: c2, opacity: 0.55 }]} />
      <Text style={styles.name} numberOfLines={1}>
        {(category.name || '').toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 92,
    borderRadius: radii.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  bg: { ...StyleSheet.absoluteFillObject },
  name: { ...typography.h3, color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },
});
