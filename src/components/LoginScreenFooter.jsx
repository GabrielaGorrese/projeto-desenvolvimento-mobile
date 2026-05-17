import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { scaleW } from '../theme/loginLayout';

export default function LoginScreenFooter({
  text = 'Desenvolvimento SATC | 2026',
}) {
  return <Text style={styles.footer}>{text}</Text>;
}

const styles = StyleSheet.create({
  footer: {
    fontSize: scaleW(12),
    lineHeight: scaleW(14),
    color: colors.footerMuted,
    textAlign: 'center',
    width: scaleW(320),
    alignSelf: 'center',
  },
});
