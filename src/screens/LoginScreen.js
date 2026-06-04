import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

export default function LoginScreen({ navigation }) {
  const { selectedRole, signIn, rememberedUsername } = useAuth();
  const r = useResponsive();
  const scale = Math.min(1.4, Math.max(1, r.width / 600));
  const insets = useSafeAreaInsets();
  const role     = selectedRole || 'attendant';
  const isManager = role === 'manager';
  const headerColor = isManager ? colors.manager : colors.attendant;
  const maxW = r.isLandscape
    ? Math.max(420, Math.min(1100, r.width * 0.65))
    : r.width;
  const compact = r.isTablet && r.isLandscape;
  const comfyPortrait = r.isPortrait;

  const [username, setUsername] = useState(rememberedUsername || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!rememberedUsername);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

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
        Alert.alert('Acesso negado', 'Esta conta não é de gerente.');
      }
    } catch (err) {
      setError(err?.uiMessage || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />
      <View style={[styles.topArea, { paddingTop: insets.top + 56 }]}>
        <Logo size="md" />
      </View>

      {/* Sheet branco que ocupa todo o resto da tela */}
      <View style={styles.sheet}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Banner laranja full-width: o conteúdo dentro é que centraliza */}
            <View style={[styles.banner, { backgroundColor: headerColor }]}>
              <View style={[styles.bannerInner, { maxWidth: maxW }]}>
                <Pressable
                  hitSlop={10}
                  onPress={() => navigation.goBack()}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 18 }}
                  style={styles.bannerBack}
                >
                  <Feather name="arrow-left" size={22} color="#FFF" />
                </Pressable>
                <Text style={styles.bannerTitle}>{isManager ? 'GERENTE' : 'ATENDENTE'}</Text>
                <View style={{ width: 26 }} />
              </View>
            </View>

            <View style={[styles.column, { maxWidth: maxW }]}>
              <View style={[styles.form, compact && styles.formCompact, comfyPortrait && styles.formPortrait]}>
                <Input
                  label="Usuário"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                  style={[compact && styles.inputCompact, comfyPortrait && styles.inputPortrait]}
                  inputStyle={[
                    { fontSize: (compact ? 14 : comfyPortrait ? 17 : 15) * scale },
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
                  inputStyle={[
                    { fontSize: (compact ? 14 : comfyPortrait ? 17 : 15) * scale },
                  ]}
                />

                <View style={[styles.remember, comfyPortrait && styles.rememberPortrait]}>
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
                      compact && styles.rememberLabelCompact,
                      comfyPortrait && styles.rememberLabelPortrait,
                    ]}
                  >
                    Lembrar usuário
                  </Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={[styles.actions, compact && !isManager && styles.actionsCompact]}>
                  <Button
                    title="ENTRAR"
                    onPress={onSubmit}
                    loading={loading}
                    size={comfyPortrait ? 'lg' : compact ? 'sm' : 'md'}
                    fullWidth
                    style={[
                      { height: 48 * scale },
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
                        size={comfyPortrait ? 'lg' : 'sm'}
                        fullWidth
                        style={styles.actionHalf}
                      />
                    ) : (
                      <Pressable
                        onPress={() => navigation.navigate('Register')}
                        android_ripple={{ color: 'rgba(204,126,74,0.18)' }}
                        style={({ pressed }) => [
                          styles.cadastrar,
                          comfyPortrait && styles.cadastrarPortrait,
                          pressed && Platform.OS !== 'android' && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={[styles.cadastrarLabel, comfyPortrait && styles.cadastrarLabelPortrait]}>
                          CADASTRAR
                        </Text>
                      </Pressable>
                    )
                  ) : null}
                </View>
              </View>
            </View>

            <Text style={[styles.footer, { marginBottom: insets.bottom + 12 }]}>
              Desenvolvimento SATC | 2026
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.bgDark },
  topArea:  { paddingBottom: 26, alignItems: 'center' },

  // Sheet branco — ocupa todo o espaço abaixo do logo até o fim da tela
  sheet: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  scroll:   { flexGrow: 1, alignItems: 'center', paddingBottom: 24 },
  column:   { width: '100%' },

  banner: {
    width: '100%',
    paddingVertical: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: 'center',
  },
  bannerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bannerBack:  { width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
  bannerTitle: {
    color: '#FFF',
    fontSize: 22 * scale,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  form: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
  },
  formCompact: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  formPortrait: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
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
  remember: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 4 },
  rememberPortrait: { marginTop: 10, marginBottom: 8 },
  rememberLabel: {
    marginLeft: 8,
    color: colors.textDark,
    fontSize: 13 * scale,
  },
  rememberSwitchCompact: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  rememberSwitchPortrait: {
    transform: [{ scaleX: 1.08 }, { scaleY: 1.08 }],
  },
  rememberLabelCompact: {
    fontSize: 12,
  },
  rememberLabelPortrait: {
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },

  actions: { marginTop: 18 },
  actionsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  actionHalf: { flex: 1 },
  actionFull: { alignSelf: 'stretch' },

  cadastrar: {
    marginTop: 12,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // contém o ripple dentro das bordas
  },
  cadastrarLabel: { color: colors.primary, fontWeight: '800', letterSpacing: 1, fontSize: 14 },
  cadastrarPortrait: { height: 54, marginTop: 14 },
  cadastrarLabelPortrait: { fontSize: 16 },

  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 'auto', paddingTop: 24 },
});
