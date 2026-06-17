import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import BaseHeader from './BaseHeader';
import { typography } from '../theme';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

export default function DarkHeader({ title, subtitle, onBack, right }) {
  const r = useResponsive();
  const minSide = Math.min(r.width, r.height);

  const backSize = Math.round(Math.max(56, Math.min(96, minSide * 0.085)));
  const iconSize = Math.round(Math.max(22, Math.min(42, minSide * 0.05)));

  const titleSize = Math.round(Math.max(20, Math.min(34, minSide * 0.04)));
  const titleLineHeight = Math.round(titleSize * 1.2);

  const subtitleSize = Math.round(Math.max(14, Math.min(24, minSide * 0.028)));
  const subtitleLineHeight = Math.round(subtitleSize * 1.3);
  const subtitleMarginTop = scaleSize(6, minSide);

  return (
    <BaseHeader
      left={
        onBack ? (
          <Pressable
            onPress={onBack}
            style={{
              width: backSize,
              height: backSize,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Feather name="arrow-left" size={iconSize} color="#FFF" />
          </Pressable>
        ) : null
      }
      center={
        <View>
          <Text
            style={[
              styles.title,
              { fontSize: titleSize, lineHeight: titleLineHeight },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: subtitleSize,
                  lineHeight: subtitleLineHeight,
                  marginTop: subtitleMarginTop,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      }
      right={right}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: '#FFF',
  },
  subtitle: {
    color: '#C0C0C0',
  },
});