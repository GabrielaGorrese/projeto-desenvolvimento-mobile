import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../components/Logo';
import { colors, radii, typography } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

import GradientView from '../components/GradientView';
import { gradients } from '../theme/colors';

const roleImages = {
  ATENDENTE: require('../../assets/icons/atendente.png'),
  GERENTE: require('../../assets/icons/gerente.png'),
};

export default function RoleSelectScreen({ navigation }) {
  const { setSelectedRole } = useAuth();
  const r = useResponsive();

  const insets = useSafeAreaInsets();

  function pick(role) {
    setSelectedRole(role);
    navigation.navigate('Login');
  }

  const cardsRow = false;
  const maxW = r.isLandscape
    ? Math.max(520, Math.min(1200, r.width * 0.78))
    : r.width;

  const minSide = Math.min(r.width, r.height);
  const cardHeight = Math.round(Math.max(100, Math.min(180, minSide * 0.30)));
  const iconSize = Math.round(Math.max(44, Math.min(80, minSide * 0.11)));
  const labelFontSize = Math.round(Math.max(22, Math.min(34, minSide * 0.06)));
  const iconWidth = Math.round(Math.max(72, Math.min(96, iconSize * 1.35)));
  const labelMarginLeft = Math.round(Math.max(12, Math.min(18, minSide * 0.02)));
  const cardPaddingH = Math.round(Math.max(20, Math.min(28, minSide * 0.06)));
  const portraitLift = cardsRow ? 0 : -Math.round(Math.max(8, Math.min(18, minSide * 0.03)));

  return (
    <GradientView colors={gradients.ui.dark} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      <View style={[styles.darkArea, { paddingTop: insets.top + 56 }]}>
        <Logo size="md" />
        <Pressable
          onPress={() => navigation.navigate('ApiConfig')}
          hitSlop={12}
          style={[styles.gear, { top: insets.top + 12 }]}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 22 }}
        >
          <Feather name="settings" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.heading}>Quem está tentando acessar?</Text>
        <View
          style={[
            styles.content,
            { maxWidth: maxW },
            portraitLift !== 0 && { transform: [{ translateY: portraitLift }] },
          ]}
        >

          <View style={cardsRow ? styles.cardsRow : styles.cardsCol}>
            <RoleCard
              label="ATENDENTE"
              gradient={gradients.ui.primary}
              onPress={() => pick('attendant')}
              wide={!cardsRow}
              cardHeight={cardHeight}
              iconSize={iconSize}
              iconWidth={iconWidth}
              labelFontSize={labelFontSize}
              labelMarginLeft={labelMarginLeft}
              cardPaddingH={cardPaddingH}
            />
            <RoleCard
              label="GERENTE"
              gradient={gradients.ui.manager}
              onPress={() => pick('manager')}
              wide={!cardsRow}
              cardHeight={cardHeight}
              iconSize={iconSize}
              iconWidth={iconWidth}
              labelFontSize={labelFontSize}
              labelMarginLeft={labelMarginLeft}
              cardPaddingH={cardPaddingH}
            />
          </View>
        </View>
      </View>
    </GradientView>
  );
}

function RoleCard({
  label,
  gradient,
  onPress,
  wide,
  cardHeight,
  iconSize,
  iconWidth,
  labelFontSize,
  labelMarginLeft,
  cardPaddingH,
}) {
  const imageSource = roleImages[label] || roleImages.ATENDENTE;
  const imageSize = Math.round(iconSize * 2.25);

  return (
    <View style={[styles.cardWrap, wide ? styles.cardWide : styles.cardFlex]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed && Platform.OS !== 'android' && { opacity: 0.78 },
        ]}
      >
        <GradientView
          colors={gradient}
          style={[styles.card, { height: cardHeight, paddingHorizontal: cardPaddingH }]}
        >
          <View style={[styles.cardIcon, { width: iconWidth }]}>
            <Image
              source={imageSource}
              style={[styles.cardImage, { width: imageSize, height: imageSize }]}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[
              styles.cardLabel,
              {
                fontSize: labelFontSize,
                marginLeft: imageSize,
                lineHeight: Math.round(labelFontSize * 1.1),
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </GradientView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  darkArea: { paddingBottom: 26, alignItems: 'center' },
  gear:     { position: 'absolute', right: 16, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  sheet: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 28,
    justifyContent: 'space-between',
    width: '92%',
    alignSelf: 'center'
  },
  content:  {
    width: '70%',
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  heading:  { ...typography.h3, color: colors.textDark, marginBottom: 22, fontSize: 28, textAlign: 'center', marginTop: 18 },

  cardsCol: { flexDirection: 'column' },
  cardsRow: { flexDirection: 'row' },

  cardWrap: { marginBottom: 22 },
  cardWide: { width: '100%' },
  cardFlex: { flex: 1, marginHorizontal: 6 },
  cardPressable: { borderRadius: radii.lg, overflow: 'hidden' },

  card: {
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardIcon: { position: 'absolute', left: 0, top: '4%' },
  cardImage: { tintColor: '#FFF' },
  cardLabel: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: typography.familyHeavy,
  }
});
