import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, Image, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

import GradientView from '../components/GradientView';
import { gradients } from '../theme/colors';

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

export default function CategoryCard({ category, onPress, style, selected, dimmed }) {
  const { width } = useWindowDimensions();
  const scale = width / 375;

  const { gradient, image } = useMemo(
    () => getGradient(category.name),
    [category.name]
  );

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          height: 136 * scale,
          borderRadius: radii.lg * scale,
          margin: 6 * scale,
          borderWidth: 3 * scale,
        },
        selected && styles.cardSelected,
        dimmed && styles.cardDimmed,
        style,
      ]}
    >
      <GradientView colors={gradient} style={StyleSheet.absoluteFill} />

      <Image
        source={image}
        style={[
          styles.image,
          {
            width: 130 * scale,
            height: 130 * scale,
          },
        ]}
        resizeMode="contain"
      />

      <Text
        style={[
          styles.name,
          {
            fontSize: 26 * scale,
            marginRight: '4%',
          },
        ]}
        numberOfLines={1}
      >
        {(category.name || '').toUpperCase()}
      </Text>

      {selected && (
        <View
          style={[
            styles.check,
            {
              top: 8 * scale,
              right: 8 * scale,
              width: 28 * scale,
              height: 28 * scale,
              borderRadius: 14 * scale,
            },
          ]}
        >
          <Feather name="check" size={14 * scale} color={colors.textDark} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'transparent',
  },
  image: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    opacity: 0.9,
  },
  bg: { ...StyleSheet.absoluteFillObject },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  name: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
    alignSelf: 'flex-end',
  },
  check: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});