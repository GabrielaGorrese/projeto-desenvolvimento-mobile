import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, typography } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

import GradientView from '../components/GradientView';
import { gradients } from '../theme/colors';

import Logo from '../components/Logo';

import SettingsButton from '../components/SettingsButton';

const roleImages = {
  attendant: require('../../assets/icons/atendente.png'),
  manager: require('../../assets/icons/gerente.png'),
};

export default function RoleSelectScreen({ navigation }) {
  const { setSelectedRole } = useAuth();
  const r = useResponsive();
  const insets = useSafeAreaInsets();

  function pick(role) {
    setSelectedRole(role);
    navigation.navigate('Login');
  }

  const minSide = Math.min(r.width, r.height);
  const panelWidth = Math.min(900, r.width * 0.9);
  const panelHorizontalPadding = Math.round(Math.max(20, Math.min(52, minSide * 0.05)));
  const logoWidth = Math.min(360, Math.max(250, r.width * 0.38));
  const logoHeight = Math.round(logoWidth * 0.39);
  const roleCardHeight = Math.round(Math.max(118, Math.min(320, minSide * 0.26)));
  const roleIconSize = Math.round(Math.max(58, Math.min(132, minSide * 0.15)));
  const titleSize = Math.round(Math.max(22, Math.min(30, minSide * 0.038)));
  const headerIconSize = Math.round(Math.max(86, Math.min(122, minSide * 0.12)));
  const subheadingSize = Math.round(Math.max(20, Math.min(20, minSide * 0.026)));
  const roleTitleSize = Math.round(Math.max(20, Math.min(28, minSide * 0.035)));
  const cardPaddingH = Math.round(Math.max(18, Math.min(30, minSide * 0.032)));
  const brandBottom = Math.round(Math.max(44, Math.min(82, minSide * 0.08)));

  return (
    <GradientView colors={gradients.ui.dark} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      <SettingsButton navigation={navigation} />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 82, paddingBottom: insets.bottom + 42 },
        ]}
      >
        <View style={[styles.brand, { marginBottom: brandBottom }]}>
          <Logo size="lg" subtitle="Boas vindas!" />
        </View>

        <View style={[styles.panel, { width: panelWidth, paddingHorizontal: panelHorizontalPadding }]}>

          <Text style={[styles.heading, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.18), paddingTop: 64 }]}>
            {'Quem est\u00e1 tentando acessar?'}
          </Text>
          <Text style={[styles.subheading, { fontSize: subheadingSize, paddingBottom: 24, marginTop: 8 }]}>
            Selecione o tipo de conta para continuar.
          </Text>

          <View style={styles.cards}>
            <RoleCard
              title="ATENDENTE"
              imageSource={roleImages.attendant}
              gradient={gradients.ui.primary}
              onPress={() => pick('attendant')}
              height={roleCardHeight}
              iconSize={roleIconSize}
              titleSize={roleTitleSize}
              paddingHorizontal={cardPaddingH}
            />
            <RoleCard
              title="GERENTE"
              imageSource={roleImages.manager}
              gradient={gradients.ui.manager}
              onPress={() => pick('manager')}
              height={roleCardHeight}
              iconSize={roleIconSize}
              titleSize={roleTitleSize}
              paddingHorizontal={cardPaddingH}
            />
          </View>
        </View>

        <View style={styles.security}>
          <Text style={styles.securityText}>{'Desenvolvimento SATC | 2026'}</Text>
        </View>
      </ScrollView>
    </GradientView>
  );
}

function RoleCard({
  title,
  imageSource,
  gradient,
  onPress,
  height,
  iconSize,
  titleSize,
  paddingHorizontal,
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.22)' }}
      style={({ pressed }) => [
        styles.cardPressable,
        pressed && Platform.OS !== 'android' && styles.cardPressed,
      ]}
    >
      <GradientView colors={gradient} style={[styles.card, { minHeight: height, paddingHorizontal }]}>
        <Image
          source={imageSource}
          style={[styles.roleIcon, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}
          resizeMode="contain"
        />

        <View style={styles.roleText}>
          <Text
            style={[styles.roleTitle, { fontSize: 40, lineHeight: Math.round(titleSize * 1.18) }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <Feather name="chevron-right" size={42} color="#FFFFFF" />
      </GradientView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  gear: {
    position: 'absolute',
    right: 24,
    zIndex: 2,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 82,
  },
  welcome: {
    marginTop: -8,
    color: '#FFFFFF',
    fontFamily: typography.familyBold,
    fontSize: 25,
    fontWeight: '800',
  },
  panel: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 52,
    paddingTop: 50,
    paddingBottom: 58,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.24,
        shadowRadius: 22,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  headerIcon: {
    width: 122,
    height: 122,
    borderRadius: 61,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8E7DA',
    marginBottom: 34,
  },
  heading: {
    color: '#202124',
    fontFamily: typography.familyHeavy,
    fontWeight: '900',
    lineHeight: 42,
    textAlign: 'center',
  },
  subheading: {
    marginTop: 24,
    color: '#656565',
    fontFamily: typography.family,
    fontSize: 24,
    lineHeight: 31,
    textAlign: 'center',
  },
  cards: {
    alignSelf: 'stretch',
    gap: 34,
    marginTop: 66,
  },
  cardPressable: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.992 }],
  },
  card: {
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 24,
  },
  roleIcon: {
    flexShrink: 0,
    marginLeft: 4
  },
  roleText: {
    flex: 1,
    marginLeft: 28,
    marginRight: 16,
  },
  roleTitle: {
    color: '#FFFFFF',
    fontFamily: typography.familyHeavy,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  securityText: {
    marginTop: 16,
    marginLeft: 20,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: typography.family,
    fontSize: 21,
    lineHeight: 28,
  },
});
