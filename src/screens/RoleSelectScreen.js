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
    ? Math.max(420, Math.min(1100, r.width * 0.65))
    : r.width;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Topo escuro com logo — paddingTop respeita inset + folga generosa */}
      <View style={[styles.darkArea, { paddingTop: insets.top + 56 }]}>
        <Logo size="md" />
      </View>

      <View style={styles.sheet}>
        <View style={[styles.content, { maxWidth: maxW }]}>
          <Text style={styles.heading}>Quem está tentando acessar?</Text>

          <View style={cardsRow ? styles.cardsRow : styles.cardsCol}>
            <RoleCard
              label="ATENDENTE"
              color={colors.attendant}
              onPress={() => pick('attendant')}
              wide={!cardsRow}
            />
            <RoleCard
              label="GERENTE"
              color={colors.manager}
              onPress={() => pick('manager')}
              wide={!cardsRow}
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

function RoleCard({ label, color, onPress, wide }) {
  return (
    <View style={[styles.cardWrap, wide ? styles.cardWide : styles.cardFlex]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: color },
          pressed && Platform.OS !== 'android' && { opacity: 0.78 },
        ]}
      >
        <View style={styles.cardIcon}>
          <Feather name="user" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.cardLabel}>{label}</Text>
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
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'space-between',
  },
  content:  { width: '100%', alignSelf: 'center' },
  heading:  { ...typography.h3, color: colors.textDark, marginBottom: 24, fontSize: 18, textAlign: 'center' },

  cardsCol: { flexDirection: 'column' },
  cardsRow: { flexDirection: 'row' },

  // O ripple respeita o border-radius do filho — por isso o wrap não tem radius
  cardWrap: { marginBottom: 18 },
  cardWide: { width: '100%' },
  cardFlex: { flex: 1, marginHorizontal: 8 },

  card: {
    height: 92,
    borderRadius: radii.lg,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',  // garante que o ripple não vaza dos cantos
  },
  cardIcon: { width: 64, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 1.2, marginLeft: 12 },

  footer: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
