import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function LoginSelectionPanel({ children }) {
  return <View style={styles.panel}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.loginCard,
    paddingHorizontal: loginLayout.roleCardPaddingHorizontal,
    overflow: 'visible',
  },
});
