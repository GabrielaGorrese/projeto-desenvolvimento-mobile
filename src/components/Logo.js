import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';


export default function Logo({ size = 'lg', subtitle = 'Boas-vindas!' }) {
  const fontSize = size === 'lg' ? 38 : size === 'md' ? 28 : 22;
  const iconSize = size === 'lg' ? 36 : size === 'md' ? 28 : 22;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { alignItems: 'center' },
  row:   { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 400,
    height: 150
  },
  subtitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 6,
    fontSize: 24,
    paddingBottom: 36
  }
});

{  }
