import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
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
  const scale = Math.min(1.4, Math.max(1, r.width / 600));
  const bannerTitleFontSize = 26 * scale;
  const rememberLabelFontSize = (compact ? 15 : comfyPortrait ? 18 : 18) * scale;
  const errorFontSize = (compact ? 14 : 15) * scale;
  const inputFontSize = (compact ? 16 : comfyPortrait ? 20 : 20) * scale;
  const inputLabelFontSize = (compact ? 16 : comfyPortrait ? 20 : 20) * scale;
  const inputHeight = compact ? 52 : comfyPortrait ? 72 : 72;
  const actionButtonHeight = compact ? 62 : comfyPortrait ? 82 : 82;
  const actionButtonFontSize = (compact ? 17 : comfyPortrait ? 21 : 20) * scale;
  const actionButtonRadius = 12;
  const buttonSize = comfyPortrait ? 'lg' : compact ? 'sm' : 'md';
  const maxKeyboardLift = Math.round(Math.min(compact ? 150 : 260, Math.max(120, r.height * 0.32)));

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
          { paddingTop: insets.top + 82, paddingBottom: insets.bottom + 42 },
        ]}
      >
        <View style={[styles.brand, { marginBottom: brandBottom }]}>
          <Logo size="lg" subtitle="Boas vindas!" />
        </View>
          <View style={[styles.panel, { width: panelWidth, paddingHorizontal: panelHorizontalPadding }]}>
            <GradientView
              colors={isManager ? gradients.ui.manager : gradients.ui.primary}
              style={[
                styles.banner,
                {
                  width: bannerWidth,
                  marginHorizontal: -panelHorizontalPadding,
                },
              ]}
            >
              <Pressable
                hitSlop={10}
                onPress={() => navigation.goBack()}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 18 }}
                style={styles.bannerBack}
              >
                <Feather name="arrow-left" size={42} color="#FFF" />
              </Pressable>
              <Text style={[styles.bannerTitle, { fontSize: bannerTitleFontSize }]}>
                {isManager ? 'GERENTE' : 'ATENDENTE'}
              </Text>
              <View style={styles.bannerSpacer} />
            </GradientView>

            <View style={[styles.column, { maxWidth: maxW }]}>
              <View style={[styles.form, compact && styles.formCompact, comfyPortrait && styles.formPortrait]}>
                <Input
                  label="Usuário"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                  style={[compact && styles.inputCompact, comfyPortrait && styles.inputPortrait]}
                  labelStyle={{ fontSize: inputLabelFontSize }}
                  fieldStyle={{ height: inputHeight, paddingHorizontal: compact ? 15 : 18, marginBottom: 8 }}
                  inputStyle={[{ fontSize: inputFontSize }]}
                />
                <Input
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  style={[compact && styles.inputCompact, comfyPortrait && styles.inputPortrait]}
                  labelStyle={{ fontSize: inputLabelFontSize }}
                  fieldStyle={{ height: inputHeight, paddingHorizontal: compact ? 15 : 18, marginBottom: 8 }}
                  inputStyle={[{ fontSize: inputFontSize }]}
                />

                <View style={[styles.rememberRow, comfyPortrait && styles.rememberPortrait]}>
                  <View style={styles.remember}>
                    <Switch
                      value={remember}
                      onValueChange={setRemember}
                      trackColor={{ true: colors.primary, false: '#CCC' }}
                      thumbColor="#FFF"
                      style={[compact && styles.rememberSwitchCompact, comfyPortrait && styles.rememberSwitchPortrait]}
                    />
                    <Text
                      style={[
                        styles.rememberLabel,
                        { fontSize: rememberLabelFontSize },
                        compact && styles.rememberLabelCompact,
                        comfyPortrait && styles.rememberLabelPortrait,
                      ]}
                    >
                      Lembrar usuário
                    </Text>
                  </View>

                  {error ? (
                    <View style={styles.errorBadge}>
                      <Feather name="alert-triangle" size={20} color={colors.danger} />
                      <Text style={[styles.error, { fontSize: errorFontSize }]} numberOfLines={1}>
                        {error}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.actions, compact && !isManager && styles.actionsCompact]}>
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
                        { height: actionButtonHeight, borderRadius: actionButtonRadius },
                        pressed && Platform.OS !== 'android' && { opacity: 0.7 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cadastrarLabel,
                          { fontSize: actionButtonFontSize },
                          comfyPortrait && styles.cadastrarLabelPortrait,
                        ]}
                      >
                        CADASTRAR
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>

        <View style={styles.security}>
          <Text style={styles.securityText}>{'Desenvolvimento SATC | 2026'}</Text>
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
    marginBottom: 82,
  },
  panelMover: {
    alignItems: 'center',
  },
  panel: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 54,
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
  column: {
    alignSelf: 'stretch',
    width: '100%',
  },

  banner: {
    width: '100%',
    minHeight: 124,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 34,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36
  },
  bannerBack: { width: 44, height: 56, justifyContent: 'center', alignItems: 'center' },
  bannerSpacer: { width: 44 },
  bannerTitle: {
    color: '#FFF',
    fontFamily: typography.familyHeavy,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  form: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  formCompact: {
    paddingTop: 0,
  },
  formPortrait: {
    paddingTop: 4,
  },
  inputCompact: {
    marginTop: 6,
    marginBottom: 6,
  },
  inputPortrait: {
    marginTop: 2,
    marginBottom: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  rememberPortrait: {
    marginTop: 20,
    marginBottom: 20,
  },
  rememberLabel: {
    marginLeft: 20,
    color: colors.textDark,
  },
  rememberSwitchCompact: {
    transform: [{ scaleX: 1.8 }, { scaleY: 1.8 }],
    marginRight: 12,
  },
  rememberSwitchPortrait: {
    transform: [{ scaleX: 1.8 }, { scaleY: 1.8 }],
    marginRight: 16,
    paddingLeft: 8
  },
  rememberLabelCompact: {},
  rememberLabelPortrait: {},
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    borderRadius: radii.md,
    backgroundColor: 'rgba(212, 81, 70, 0.10)',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  error: {
    color: colors.danger,
    flexShrink: 1,
    fontSize: 13,
    marginTop: 0,
    textAlign: 'right',
  },

  actions: {
    marginTop: 22,
  },
  actionsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  actionHalf: {
    flex: 1,
  },
  actionFull: {
    alignSelf: 'stretch',
  },

  cadastrar: {
    marginTop: 20,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cadastrarLabel: {
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 17,
  },
  cadastrarPortrait: {
    marginTop: 14,
  },
  cadastrarLabelPortrait: {},
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
