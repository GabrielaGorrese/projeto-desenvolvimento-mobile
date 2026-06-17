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

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

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
  const roleCardHeight = Math.round(Math.max(118, Math.min(320, minSide * 0.26)));
  const roleIconSize = Math.round(Math.max(58, Math.min(132, minSide * 0.15)));
  const titleSize = Math.round(Math.max(22, Math.min(30, minSide * 0.038)));
  const subheadingSize = Math.round(Math.max(18, Math.min(24, minSide * 0.026)));
  const roleTitleSize = Math.round(Math.max(20, Math.min(40, minSide * 0.049)));
  const cardPaddingH = Math.round(Math.max(18, Math.min(36, minSide * 0.032)));
  const brandBottom = Math.round(Math.max(44, Math.min(82, minSide * 0.08)));
  const chevronSize = scaleSize(42, minSide);
  const scrollTopPad = scaleSize(82, minSide);
  const scrollBottomPad = scaleSize(42, minSide);
  const panelPaddingTop = scaleSize(50, minSide);
  const panelPaddingBottom = scaleSize(58, minSide);
  const panelRadius = scaleSize(14, minSide);
  const headingPaddingTop = scaleSize(64, minSide);
  const subheadingPaddingBottom = scaleSize(24, minSide);
  const subheadingMarginTop = scaleSize(8, minSide);
  const cardsGap = scaleSize(34, minSide);
  const cardsMarginTop = scaleSize(66, minSide);
  const cardPaddingV = scaleSize(24, minSide);
  const roleTextMarginLeft = scaleSize(28, minSide);
  const roleTextMarginRight = scaleSize(16, minSide);
  const roleIconMarginLeft = scaleSize(4, minSide);
  const securityMarginTop = scaleSize(40, minSide);
  const securityPaddingH = scaleSize(24, minSide);
  const securityTextMarginTop = scaleSize(16, minSide);
  const securityTextMarginLeft = scaleSize(20, minSide);
  const securityFontSize = scaleSize(21, minSide);
  const securityLineHeight = scaleSize(28, minSide);

  return (
    <GradientView colors={gradients.ui.dark} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      <SettingsButton navigation={navigation} />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + scrollTopPad, paddingBottom: insets.bottom + scrollBottomPad },
        ]}
      >
        <View style={[styles.brand, { marginBottom: brandBottom }]}>
          <Logo size="lg" subtitle="Boas vindas!" />
        </View>

        <View
          style={[
            styles.panel,
            {
              width: panelWidth,
              paddingHorizontal: panelHorizontalPadding,
              paddingTop: panelPaddingTop,
              paddingBottom: panelPaddingBottom,
              borderRadius: panelRadius,
            },
          ]}
        >

          <Text
            style={[
              styles.heading,
              {
                fontSize: titleSize,
                lineHeight: Math.round(titleSize * 1.18),
                paddingTop: headingPaddingTop,
              },
            ]}
          >
            {'Quem est\u00e1 tentando acessar?'}
          </Text>
          <Text
            style={[
              styles.subheading,
              {
                fontSize: subheadingSize,
                lineHeight: Math.round(subheadingSize * 1.29),
                paddingBottom: subheadingPaddingBottom,
                marginTop: subheadingMarginTop,
              },
            ]}
          >
            Selecione o tipo de conta para continuar.
          </Text>

          <View style={[styles.cards, { gap: cardsGap, marginTop: cardsMarginTop }]}>
            <RoleCard
              title="ATENDENTE"
              imageSource={roleImages.attendant}
              gradient={gradients.ui.primary}
              onPress={() => pick('attendant')}
              height={roleCardHeight}
              iconSize={roleIconSize}
              titleSize={roleTitleSize}
              paddingHorizontal={cardPaddingH}
              paddingVertical={cardPaddingV}
              roleTextMarginLeft={roleTextMarginLeft}
              roleTextMarginRight={roleTextMarginRight}
              roleIconMarginLeft={roleIconMarginLeft}
              chevronSize={chevronSize}
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
              paddingVertical={cardPaddingV}
              roleTextMarginLeft={roleTextMarginLeft}
              roleTextMarginRight={roleTextMarginRight}
              roleIconMarginLeft={roleIconMarginLeft}
              chevronSize={chevronSize}
            />
          </View>
        </View>

        <View style={[styles.security, { marginTop: securityMarginTop, paddingHorizontal: securityPaddingH }]}>
          <Text
            style={[
              styles.securityText,
              {
                marginTop: securityTextMarginTop,
                marginLeft: securityTextMarginLeft,
                fontSize: securityFontSize,
                lineHeight: securityLineHeight,
              },
            ]}
          >
            {'Desenvolvimento SATC | 2026'}
          </Text>
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
  paddingVertical,
  roleTextMarginLeft,
  roleTextMarginRight,
  roleIconMarginLeft,
  chevronSize,
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
      <GradientView
        colors={gradient}
        style={[styles.card, { minHeight: height, paddingHorizontal, paddingVertical }]}
      >
        <Image
          source={imageSource}
          style={[
            styles.roleIcon,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
              marginLeft: roleIconMarginLeft,
            },
          ]}
          resizeMode="contain"
        />

        <View style={[styles.roleText, { marginLeft: roleTextMarginLeft, marginRight: roleTextMarginRight }]}>
          <Text
            style={[styles.roleTitle, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.18) }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <Feather name="chevron-right" size={chevronSize} color="#FFFFFF" />
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
  brand: {
    alignItems: 'center',
  },
  panel: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  heading: {
    color: '#202124',
    fontFamily: typography.familyHeavy,
    fontWeight: '900',
    textAlign: 'center',
  },
  subheading: {
    color: '#656565',
    fontFamily: typography.family,
    textAlign: 'center',
  },
  cards: {
    alignSelf: 'stretch',
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
  },
  roleIcon: {
    flexShrink: 0,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    color: '#FFFFFF',
    fontFamily: typography.familyHeavy,
    fontWeight: '900',
  },
  security: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: typography.family,
  },
});
