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
            <Feather name="arrow-left" size={30} color="#FFF" />
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
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    ...typography.title,
    color: '#FFF',
    fontSize: 20,
  },

  subtitle: {
    color: '#C0C0C0',
    fontSize: 16,
    marginTop: 2,
  },
});