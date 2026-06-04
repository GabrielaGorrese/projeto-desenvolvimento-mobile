import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../components/Logo';
import { colors, radii, typography } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

export default function RoleSelectScreen({ navigation }) {
  const { setSelectedRole } = useAuth();
  const r = useResponsive();

  const insets = useSafeAreaInsets();

  function pick(role) {
    setSelectedRole(role);
    navigation.navigate('Login');
  }

  const cardsRow = r.isLandscape;
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Topo escuro com logo — paddingTop respeita inset + folga generosa */}
      <View style={[styles.darkArea, { paddingTop: insets.top + 56 }]}>
        <Logo size="md" />
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
              color={colors.attendant}
              icon="user"
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
              color={colors.manager}
              icon="shield"
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

        {/* Footer com paddingBottom = inset da gesture bar + folga */}
        <Text style={[styles.footer, { marginBottom: insets.bottom + 12 }]}>
          Desenvolvimento SATC | 2026
        </Text>
      </View>
    </View>
  );
}

function RoleCard({
  label,
  color,
  icon,
  onPress,
  wide,
  cardHeight,
  iconSize,
  iconWidth,
  labelFontSize,
  labelMarginLeft,
  cardPaddingH,
}) {
  return (
    <View style={[styles.cardWrap, wide ? styles.cardWide : styles.cardFlex]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: color },
          { height: cardHeight, paddingHorizontal: cardPaddingH },
          pressed && Platform.OS !== 'android' && { opacity: 0.78 },
        ]}
      >
        <View style={[styles.cardIcon, { width: iconWidth }]}>
          <Feather name={icon} size={iconSize} color="#FFFFFF" />
        </View>
        <Text
          style={[
            styles.cardLabel,
            { fontSize: labelFontSize, marginLeft: labelMarginLeft, lineHeight: Math.round(labelFontSize * 1.1) },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.bgDark },
  darkArea: { paddingBottom: 26, alignItems: 'center' },

  sheet: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 28,
    justifyContent: 'space-between', // conteúdo centralizado, footer no rodapé
  },
  content:  {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  heading:  { ...typography.h3, color: colors.textDark, marginBottom: 22, fontSize: 18, textAlign: 'center' },

  cardsCol: { flexDirection: 'column' },
  cardsRow: { flexDirection: 'row' },

  cardWrap: { marginBottom: 22 },
  cardWide: { width: '100%' },
  cardFlex: { flex: 1, marginHorizontal: 6 },

  card: {
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardIcon: { alignItems: 'center', justifyContent: 'center' },
  cardLabel: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: typography.familyHeavy,
  },

  footer: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
