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
import { colors, radii } from '../theme';
import GradientView from '../components/GradientView';
import { gradients } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

export default function LoginScreen({ navigation }) {
  const { selectedRole, signIn, signOut, rememberedUsername } = useAuth();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const role     = selectedRole || 'attendant';
  const isManager = role === 'manager';
  const headerColor = isManager ? colors.manager : colors.attendant;
  const maxW = r.isLandscape
    ? Math.max(420, Math.min(1100, r.width * 0.65))
    : r.width;
  const compact = r.isTablet && r.isLandscape;
  const comfyPortrait = r.isPortrait;
  const scale = Math.min(1.4, Math.max(1, r.width / 600));
  const bannerTitleFontSize = 24 * scale;
  const rememberLabelFontSize = (compact ? 15 : comfyPortrait ? 17 : 16) * scale;
  const errorFontSize = (compact ? 14 : 15) * scale;
  const inputFontSize = (compact ? 16 : comfyPortrait ? 18 : 17) * scale;
  const inputLabelFontSize = (compact ? 16 : comfyPortrait ? 18 : 17) * scale;
  const inputHeight = compact ? 52 : comfyPortrait ? 60 : 56;
  const actionButtonHeight = compact ? 54 : comfyPortrait ? 68 : 8;
  const actionButtonFontSize = (compact ? 15 : comfyPortrait ? 18 : 17) * scale;
  const buttonSize = comfyPortrait ? 'lg' : compact ? 'sm' : 'md';
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const maxKeyboardLift = Math.round(Math.min(compact ? 150 : 260, Math.max(120, r.height * 0.32)));

  const [username, setUsername] = useState(rememberedUsername || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!rememberedUsername);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    function animateSheet(toValue, duration = 220) {
      Animated.timing(sheetTranslateY, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    
    const showSub = Keyboard.addListener(showEvt, (event) => {
      const keyboardHeight = event.endCoordinates?.height || 0;
      const offset = keyboardHeight * 0.35
      const lift = Math.min(maxKeyboardLift + offset, Math.max(0, keyboardHeight - insets.bottom + 12));
      animateSheet(-lift, event.duration || 220);
    });
    const hideSub = Keyboard.addListener(hideEvt, (event) => {
      animateSheet(0, event.duration || 180);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, maxKeyboardLift, sheetTranslateY]);

  async function onSubmit() {
    if (!username.trim() || !password) {
      setError('Informe usuário e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await signIn({ username: username.trim(), password, remember });
      if (isManager && user.role !== 'manager') {
        // Logou com sucesso mas a conta não é de gerente: desfaz e avisa inline.
        await signOut();
        setError('Esta conta não é de gerente.');
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
      <View style={[styles.topArea, { paddingTop: insets.top + 56 }]}>
        <Logo size="md" />
      </View>

      <View style={styles.sheetBackground} />

      {/* Sheet branco que ocupa todo o resto da tela */}
      <Animated.View
        style={[
          styles.sheetMover,
          { transform: [{ translateY: sheetTranslateY }] },
        ]}
      >
        <View style={styles.sheetShadow}>
          <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Banner laranja full-width: o conteúdo dentro é que centraliza */}
            <GradientView colors={isManager ? gradients.ui.manager : gradients.ui.primary} style={styles.banner}>
              <View style={[styles.bannerInner, { maxWidth: maxW }]}>
                <Pressable
                  hitSlop={10}
                  onPress={() => navigation.goBack()}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 18 }}
                  style={styles.bannerBack}
                >
                  <Feather name="arrow-left" size={32} color="#FFF" />
                </Pressable>
                <Text style={[styles.bannerTitle, { fontSize: bannerTitleFontSize }]}>
                  {isManager ? 'GERENTE' : 'ATENDENTE'}
                </Text>
                <View style={{ width: 26 }} />
              </View>
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
                  inputStyle={[
                    { fontSize: inputFontSize },
                  ]}
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
                  inputStyle={[
                    { fontSize: inputFontSize },
                  ]}
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
                      <Text
                        style={[styles.error, { fontSize: errorFontSize }]}
                        numberOfLines={1}
                      >
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
                      isManager && { backgroundColor: headerColor },
                      isManager && styles.actionFull,
                      !isManager && compact && styles.actionHalf,
                    ]}
                  />
                  {!isManager ? (
                    compact ? (
                      <Button
                        title="CADASTRAR"
                        onPress={() => navigation.navigate('Register')}
                        variant="outline"
                        size={buttonSize}
                        fullWidth
                        textStyle={{ fontSize: actionButtonFontSize }}
                        style={[{ height: actionButtonHeight }, styles.actionHalf]}
                      />
                    ) : (
                      <Pressable
                        onPress={() => navigation.navigate('Register')}
                        android_ripple={{ color: 'rgba(204,126,74,0.18)' }}
                        style={({ pressed }) => [
                          styles.cadastrar,
                          { height: actionButtonHeight },
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
                    )
                  ) : null}
                </View>
              </View>
            </View>
          </ScrollView>
          </View>
        </View>
      </Animated.View>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  topArea:  { paddingBottom: 26, alignItems: 'center' },
  sheetMover: { flex: 1 },
  sheetShadow: {
    flex: 1,
    width: '92%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },

  sheetBackground: {
    width: '92%',
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,

    height: 600,
    backgroundColor: '#FFF',
  },

  // Sheet branco — ocupa todo o espaço abaixo do logo até o fim da tela
  sheet: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  scroll:   { flexGrow: 1, alignItems: 'center', paddingBottom: 24 },
  column:   { width: '100%' },

  banner: {
    width: '100%',
    paddingVertical: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  bannerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bannerBack:  { width: 36, height: 90, justifyContent: 'center', alignItems: 'center' },
  bannerTitle: {
      color: '#FFF',
      fontWeight: '900',
      letterSpacing: 1.2
  },

  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },
  formCompact: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  formPortrait: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 30,
  },
  inputCompact: {
    marginBottom: 10,
  },
  inputPortrait: {
    marginBottom: 16,
  },
  inputTextCompact: {
    fontSize: 14,
  },
  inputTextPortrait: {
    fontSize: 17,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  remember: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  rememberPortrait: { marginTop: 12, marginBottom: 10 },
  rememberLabel: {
    marginLeft: 8,
    color: colors.textDark,
  },
  rememberSwitchCompact: {
    transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }],
    marginRight: 12,
  },
  rememberSwitchPortrait: {
    transform: [{ scaleX: 1.08 }, { scaleY: 1.08 }],
    marginRight: 12,
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
  error: { color: colors.danger, flexShrink: 1, fontSize: 13, marginTop: 0, textAlign: 'right' },

  actions: { marginTop: 22 },
  actionsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  actionHalf: { flex: 1 },
  actionFull: { alignSelf: 'stretch' },

  cadastrar: {
    marginTop: 14,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // contém o ripple dentro das bordas
  },
  cadastrarLabel: { color: colors.primary, fontWeight: '800', letterSpacing: 1, fontSize: 17 },
  cadastrarPortrait: { marginTop: 14 },
  cadastrarLabelPortrait: {}
});
