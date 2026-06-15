import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import BaseHeader from './BaseHeader';
import { typography } from '../theme';

export default function DarkHeader({ title, subtitle, onBack, right }) {
  return (
    <BaseHeader
      left={
        onBack ? (
          <Pressable onPress={onBack} style={styles.back}>
            <Feather name="arrow-left" size={42} color="#FFF" />
          </Pressable>
        ) : null
      }
      center={
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      }
      right={right}
    />
  );
}

const styles = StyleSheet.create({
  back: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    ...typography.title,
    color: '#FFF',
    fontSize: 30,
    lineHeight: 36,
  },

  subtitle: {
    color: '#C0C0C0',
    fontSize: 22,
    lineHeight: 29,
    marginTop: 6,
  },
});
