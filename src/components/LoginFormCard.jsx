import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoginRoleBanner from './LoginRoleBanner';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function LoginFormCard({ role, onBackPress, children }) {
  return (
    <View style={styles.card}>
      <LoginRoleBanner role={role} onBackPress={onBackPress} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.loginCard,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    paddingHorizontal: loginLayout.formPaddingHorizontal,
    paddingTop: loginLayout.formPaddingTop,
  },
});
