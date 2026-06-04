import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { colors, radii, typography } from '../theme';

function getGradient(name) {
  const k = (name || '').toLowerCase();
  if (k.includes('refrige'))  return {
    gradient: colors.catRefrigerantes,
    image: require('../../assets/categorias/catRefrigerantes.png'),
  };

  if (k.includes('suco'))  return {
    gradient: colors.catSucos,
    image: require('../../assets/categorias/catSucos.png'),
  };

  if (k.includes('prato'))  return {
    gradient: colors.catPratos,
    image: require('../../assets/categorias/catPratos.png'),
  };

  if (k.includes('lanche'))  return {
    gradient: colors.catLanches,
    image: require('../../assets/categorias/catLanches.png'),
  };

  if (k.includes('salgado'))  return {
    gradient: colors.catSalgados,
    image: require('../../assets/categorias/catSalgados.png'),
  };

  if (k.includes('doce'))  return {
    gradient: colors.catDoces,
    image: require('../../assets/categorias/catDoces.png'),
  };

  if (k.includes('sobre'))  return {
    gradient: colors.catDoces,
    image: require('../../assets/categorias/catDoces.png'),
  };

  if (k.includes('combo'))  return {
    gradient: colors.catCombos,
    image: require('../../assets/categorias/catCombos.png'),
  };

  if (k.includes('bebida'))  return {
    gradient: colors.catRefrigerantes,
    image: require('../../assets/categorias/catRefrigerantes.png'),
  };

  if (k.includes('porç'))  return {
    gradient: colors.catSalgados,
    image: require('../../assets/categorias/catSalgados.png'),
  };

  return {
    gradient: colors.catDefault,
    image: require('../../assets/categorias/catDefault.png'),
  };
}

export default function CategoryCard({ category, onPress, style }) {
  const { gradient, image } = useMemo(
    () => getGradient(category.name),
    [category.name]
  );

  const [c1, c2] = gradient;

  return (
    <Pressable onPress={onPress} style={[styles.card, style]}>
      <View style={[styles.bg, { backgroundColor: c1 }]} />
      <View style={[styles.bg, { backgroundColor: c2, opacity: 0.55 }]} />
      <Image source={image} style={styles.image} resizeMode="contain" />
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
  image: {
    position: 'absolute',
    left: 0,
    bottom: 0, // ou 'top: 0' se preferir
    width: 90,
    height: 90,
    opacity: 0.9,
  },
  bg: { ...StyleSheet.absoluteFillObject },
  name: { ...typography.h3, color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },
});
