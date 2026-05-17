import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function LoginRoleBanner({ role = 'ATENDENTE', onBackPress }) {
  return (
    <View style={styles.banner}>
      <TouchableOpacity
        onPress={onBackPress}
        style={styles.backButton}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons
          name="chevron-back"
          size={loginLayout.backIconSize}
          color={colors.white}
        />
      </TouchableOpacity>
      <Text style={styles.role}>{role}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: loginLayout.bannerHeight,
    backgroundColor: colors.loginBanner,
    paddingLeft: loginLayout.bannerPaddingLeft,
    paddingRight: loginLayout.formPaddingHorizontal,
  },
  backButton: {
    width: loginLayout.backIconSize,
    height: loginLayout.backIconSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: loginLayout.formPaddingHorizontal - 10,
  },
  role: {
    flex: 1,
    fontSize: loginLayout.roleFontSize,
    fontWeight: '700',
    lineHeight: loginLayout.roleFontSize * 1.2,
    color: colors.white,
    letterSpacing: 0.5,
  },
});
