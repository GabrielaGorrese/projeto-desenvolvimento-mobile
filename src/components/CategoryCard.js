import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, Image, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { getUiScale } from '../utils/uiScale';

import GradientView from '../components/GradientView';

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

export default function CategoryCard({ category, onPress, onDelete, style, selected, dimmed }) {
  const { width, height } = useWindowDimensions();
  const scale = getUiScale(width, height);

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
          height: 104 * scale,
          borderRadius: radii.lg * scale,
          margin: 5 * scale,
          borderWidth: 2 * scale,
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
            width: 92 * scale,
            height: 92 * scale,
          },
        ]}
        resizeMode="contain"
      />

      <Text
        style={[
          styles.name,
          {
            fontSize: 18 * scale,
            marginRight: '4%',
          },
        ]}
        numberOfLines={1}
      >
        {(category.name || '').toUpperCase()}
      </Text>

        <Text style={styles.name} numberOfLines={1}>
          {(category.name || '').toUpperCase()}
        </Text>

        {selected && (
          <View
            style={[
              styles.check,
              {
                top: 6 * scale,
                right: 6 * scale,
                width: 20 * scale,
                height: 20 * scale,
                borderRadius: 10 * scale,
              },
            ]}
          >
            <Feather name="check" size={10 * scale} color={colors.textDark} />
          </View>
        )}

        {onDelete ? (
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 18 }}
            style={({ pressed }) => [styles.delBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="trash-2" size={16} color="#FFF" />
          </Pressable>
        ) : null}
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
  delBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
