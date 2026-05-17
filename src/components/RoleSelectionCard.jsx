import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

const roleConfig = {
  ATENDENTE: {
    icon: 'room-service-outline',
  },
  GERENTE: {
    icon: 'account-tie-outline',
  },
};

export default function RoleSelectionCard({ role, onPress }) {
  const config = roleConfig[role] || roleConfig.ATENDENTE;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Acessar como ${role}`}
    >
      <View
        style={[
          styles.illustration,
          { marginTop: loginLayout.roleIllustrationOffsetTop },
        ]}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={loginLayout.roleIllustrationSize * 0.52}
          color={colors.white}
        />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{role}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: loginLayout.roleCardWidth,
    height: loginLayout.roleCardHeight,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.roleCardBackground,
    borderRadius: loginLayout.roleCardRadius,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  illustration: {
    width: loginLayout.roleIllustrationSize,
    height: loginLayout.roleIllustrationSize,
    marginLeft: loginLayout.roleIllustrationOffsetLeft,
    borderRadius: loginLayout.roleIllustrationSize / 2,
    backgroundColor: colors.roleCardIconOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: loginLayout.roleTitlePaddingRight,
    paddingLeft: loginLayout.formPaddingHorizontal,
  },
  title: {
    fontSize: loginLayout.roleCardTitleSize,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.8,
    textAlign: 'center',
    width: '100%',
  },
});
