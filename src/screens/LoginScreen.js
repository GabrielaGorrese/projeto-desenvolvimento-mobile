import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../components/Input';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { colors, radii, typography } from '../theme';
import GradientView from '../components/GradientView';
import { gradients } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
import SettingsButton from '../components/SettingsButton';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

export default function LoginScreen({ navigation }) {
  const { selectedRole, signIn, signOut, rememberedUsername } = useAuth();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const role = selectedRole || 'attendant';
  const isManager = role === 'manager';
  const headerColor = isManager ? colors.manager : colors.attendant;
  const minSide = Math.min(r.width, r.height);
  const panelWidth = Math.min(900, r.width * 0.9);
  const panelHorizontalPadding = Math.round(Math.max(20, Math.min(52, minSide * 0.05)));
  const bannerWidth = panelWidth;
  const brandBottom = Math.round(Math.max(44, Math.min(82, minSide * 0.08)));
  const maxW = panelWidth - panelHorizontalPadding * 2;
  const compact = r.isTablet && r.isLandscape;
  const comfyPortrait = r.isPortrait;
  const scale = Math.min(1.4, Math.max(0.85, r.width / 600));
  const bannerTitleFontSize = Math.round(26 * scale);
  const rememberLabelFontSize = scaleSize(compact ? 15 : 16, minSide);
  const errorFontSize = scaleSize(compact ? 14 : 16, minSide);
  const inputFontSize = scaleSize(compact ? 16 : 18, minSide);
  const inputLabelFontSize = scaleSize(compact ? 16 : 18, minSide);
  const inputHeight = Math.round(Math.max(48, Math.min(72, scaleSize(compact ? 52 : 72, minSide))));
  const actionButtonHeight = Math.round(Math.max(52, Math.min(82, scaleSize(compact ? 62 : 82, minSide))));
  const actionButtonFontSize = scaleSize(compact ? 17 : 19, minSide);
  const actionButtonRadius = scaleSize(12, minSide);
  const buttonSize = comfyPortrait ? 'lg' : compact ? 'sm' : 'md';
  const scrollTopPad = scaleSize(82, minSide);
  const scrollBottomPad = scaleSize(42, minSide);
  const panelPaddingBottom = scaleSize(58, minSide);
  const panelRadius = scaleSize(14, minSide);
  const bannerMinHeight = scaleSize(124, minSide);
  const bannerPaddingH = scaleSize(36, minSide);
  const bannerMarginBottom = scaleSize(36, minSide);
  const bannerRadius = scaleSize(12, minSide);
  const bannerBackSize = scaleSize(44, minSide);
  const bannerBackHeight = scaleSize(56, minSide);
  const backIconSize = scaleSize(42, minSide);
  const formPaddingTop = scaleSize(compact ? 0 : 8, minSide);
  const rememberRowGap = scaleSize(12, minSide);
  const rememberRowMarginTop = scaleSize(compact ? 8 : comfyPortrait ? 20 : 8, minSide);
  const rememberRowMarginBottom = scaleSize(compact ? 12 : comfyPortrait ? 20 : 12, minSide);
  const rememberLabelMarginLeft = scaleSize(20, minSide);
  const switchScale = Math.min(1.6, Math.max(1.1, minSide / REF_MIN_SIDE * 1.6));
  const switchMarginRight = scaleSize(compact ? 12 : 16, minSide);
  const switchPaddingLeft = scaleSize(8, minSide);
  const errorIconSize = scaleSize(20, minSide);
  const errorBadgeGap = scaleSize(6, minSide);
  const errorBadgePaddingH = scaleSize(16, minSide);
  const errorBadgePaddingV = scaleSize(6, minSide);
  const actionsMarginTop = scaleSize(compact ? 14 : 22, minSide);
  const actionsGap = scaleSize(10, minSide);
  const cadastrarMarginTop = scaleSize(compact ? 14 : 20, minSide);
  const cadastrarBorderWidth = scaleSize(2, minSide);
  const inputMarginTop = scaleSize(compact ? 6 : comfyPortrait ? 2 : 0, minSide);
  const inputMarginBottom = scaleSize(6, minSide);
  const inputPaddingH = scaleSize(compact ? 15 : 18, minSide);
  const inputFieldMarginBottom = scaleSize(8, minSide);
  const securityMarginTop = scaleSize(40, minSide);
  const securityPaddingH = scaleSize(24, minSide);
  const securityTextMarginTop = scaleSize(16, minSide);
  const securityTextMarginLeft = scaleSize(20, minSide);
  const securityFontSize = scaleSize(21, minSide);
  const securityLineHeight = scaleSize(28, minSide);

  const [username, setUsername] = useState(rememberedUsername || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!rememberedUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    if (!username.trim() || !password) {
      setError('Informe usu\u00e1rio e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await signIn({ username: username.trim(), password, remember });
      if (isManager && user.role !== 'manager') {
        await signOut();
        setError('Esta conta n\u00e3o \u00e9 de gerente.');
      }
    } catch (err) {
      setError(err?.uiMessage || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientView colors={gradients.ui.dark} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      <SettingsButton navigation={navigation} />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                paddingBottom: panelPaddingBottom,
                borderRadius: panelRadius,
              },
            ]}
          >
            <GradientView
              colors={isManager ? gradients.ui.manager : gradients.ui.primary}
              style={[
                styles.banner,
                {
                  width: bannerWidth,
                  marginHorizontal: -panelHorizontalPadding,
                  minHeight: bannerMinHeight,
                  paddingHorizontal: bannerPaddingH,
                  marginBottom: bannerMarginBottom,
                  borderTopLeftRadius: bannerRadius,
                  borderTopRightRadius: bannerRadius,
                },
              ]}
            >
              <Pressable
                hitSlop={10}
                onPress={() => navigation.goBack()}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 18 }}
                style={[styles.bannerBack, { width: bannerBackSize, height: bannerBackHeight }]}
              >
                <Feather name="arrow-left" size={backIconSize} color="#FFF" />
              </Pressable>
              <Text style={[styles.bannerTitle, { fontSize: bannerTitleFontSize }]}>
                {isManager ? 'GERENTE' : 'ATENDENTE'}
              </Text>
              <View style={[styles.bannerSpacer, { width: bannerBackSize }]} />
            </GradientView>

            <View style={[styles.column, { maxWidth: maxW }]}>
              <View style={[styles.form, { paddingTop: formPaddingTop }]}>
                <Input
                  label="Usuário"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                  style={{ marginTop: inputMarginTop, marginBottom: inputMarginBottom }}
                  labelStyle={{ fontSize: inputLabelFontSize }}
                  fieldStyle={{ height: inputHeight, paddingHorizontal: inputPaddingH, marginBottom: inputFieldMarginBottom }}
                  inputStyle={[{ fontSize: inputFontSize }]}
                />
                <Input
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  style={{ marginTop: inputMarginTop, marginBottom: inputMarginBottom }}
                  labelStyle={{ fontSize: inputLabelFontSize }}
                  fieldStyle={{ height: inputHeight, paddingHorizontal: inputPaddingH, marginBottom: inputFieldMarginBottom }}
                  inputStyle={[{ fontSize: inputFontSize }]}
                />

                <View
                  style={[
                    styles.rememberRow,
                    {
                      gap: rememberRowGap,
                      marginTop: rememberRowMarginTop,
                      marginBottom: rememberRowMarginBottom,
                    },
                  ]}
                >
                  <View style={styles.remember}>
                    <Switch
                      value={remember}
                      onValueChange={setRemember}
                      trackColor={{ true: colors.primary, false: '#CCC' }}
                      thumbColor="#FFF"
                      style={{
                        transform: [{ scaleX: switchScale }, { scaleY: switchScale }],
                        marginRight: switchMarginRight,
                        paddingLeft: comfyPortrait ? switchPaddingLeft : 0,
                      }}
                    />
                    <Text
                      style={[
                        styles.rememberLabel,
                        { fontSize: rememberLabelFontSize, marginLeft: rememberLabelMarginLeft },
                      ]}
                    >
                      Lembrar usuário
                    </Text>
                  </View>

                  {error ? (
                    <View
                      style={[
                        styles.errorBadge,
                        {
                          gap: errorBadgeGap,
                          paddingHorizontal: errorBadgePaddingH,
                          paddingVertical: errorBadgePaddingV,
                        },
                      ]}
                    >
                      <Feather name="alert-triangle" size={errorIconSize} color={colors.danger} />
                      <Text style={[styles.error, { fontSize: errorFontSize }]} numberOfLines={1}>
                        {error}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.actions,
                    { marginTop: actionsMarginTop },
                    compact && !isManager && { flexDirection: 'row', alignItems: 'center', gap: actionsGap },
                  ]}
                >
                  <Button
                    title="ENTRAR"
                    onPress={onSubmit}
                    loading={loading}
                    size={buttonSize}
                    fullWidth
                    textStyle={{ fontSize: actionButtonFontSize }}
                    style={[
                      { height: actionButtonHeight },
                      { borderRadius: actionButtonRadius },
                      isManager && { backgroundColor: headerColor },
                      isManager && styles.actionFull,
                      !isManager && compact && styles.actionHalf,
                    ]}
                  />
                  {compact ? (
                    <Button
                      title="CADASTRAR"
                      onPress={() => navigation.navigate('Register')}
                      variant="outline"
                      size={buttonSize}
                      fullWidth
                      textStyle={{ fontSize: actionButtonFontSize }}
                      style={[
                        { height: actionButtonHeight, borderRadius: actionButtonRadius },
                        styles.actionHalf,
                      ]}
                    />
                  ) : (
                    <Pressable
                      onPress={() => navigation.navigate('Register')}
                      android_ripple={{ color: 'rgba(204,126,74,0.18)' }}
                      style={({ pressed }) => [
                        styles.cadastrar,
                        {
                          height: actionButtonHeight,
                          borderRadius: actionButtonRadius,
                          marginTop: cadastrarMarginTop,
                          borderWidth: cadastrarBorderWidth,
                        },
                        pressed && Platform.OS !== 'android' && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.cadastrarLabel, { fontSize: actionButtonFontSize }]}>
                        CADASTRAR
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
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
    backgroundColor: '#ffffff',
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
  column: {
    alignSelf: 'stretch',
    width: '100%',
  },

  banner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerBack: { justifyContent: 'center', alignItems: 'center' },
  bannerSpacer: {},
  bannerTitle: {
    color: '#FFF',
    fontFamily: typography.familyHeavy,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  form: {
    paddingBottom: 0,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  rememberLabel: {
    color: colors.textDark,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: radii.md,
    backgroundColor: 'rgba(212, 81, 70, 0.10)',
  },
  error: {
    color: colors.danger,
    flexShrink: 1,
    marginTop: 0,
    textAlign: 'right',
  },

  actions: {},
  actionHalf: {
    flex: 1,
  },
  actionFull: {
    alignSelf: 'stretch',
  },

  cadastrar: {
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cadastrarLabel: {
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
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
