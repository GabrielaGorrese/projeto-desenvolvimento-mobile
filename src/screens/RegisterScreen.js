import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import DarkHeader from '../components/DarkHeader';
import FeedbackModal from '../components/FeedbackModal';
import { colors, radii } from '../theme';
import { registerRequest } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
import { getUiScale } from '../utils/uiScale';

const REF_MIN_SIDE = 820;
const TABLET_MIN_SIDE = 600;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

function buildUi(minSide, scale) {
  if (minSide >= TABLET_MIN_SIDE) {
    return {
      bodyPadding: 24 * scale,
      errorFontSize: 13 * scale,
      errorMarginTop: 6 * scale,
      btnMarginTop: 14 * scale,
      inputHeight: 56 * scale,
      inputFontSize: 16 * scale,
      inputLabelFontSize: 15 * scale,
      inputPaddingH: 16 * scale,
      inputMarginBottom: 14 * scale,
      buttonHeight: 52 * scale,
      buttonFontSize: 17 * scale,
    };
  }

  return {
    bodyPadding: scaleSize(22, minSide),
    errorFontSize: scaleSize(13, minSide),
    errorMarginTop: scaleSize(6, minSide),
    btnMarginTop: scaleSize(14, minSide),
    inputHeight: Math.round(Math.max(48, Math.min(70, scaleSize(48, minSide)))),
    inputFontSize: scaleSize(16, minSide),
    inputLabelFontSize: scaleSize(15, minSide),
    inputPaddingH: scaleSize(16, minSide),
    inputMarginBottom: scaleSize(14, minSide),
    buttonHeight: Math.round(Math.max(50, Math.min(56, scaleSize(50, minSide)))),
    buttonFontSize: scaleSize(17, minSide),
  };
}

export default function RegisterScreen({ navigation }) {
  const { selectedRole } = useAuth();
  const { width, height } = useWindowDimensions();
  const r = useResponsive();
  const minSide = Math.min(width, height);
  const scale = getUiScale(width, height);
  const ui = useMemo(() => buildUi(minSide, scale), [minSide, scale]);
  const contentMaxWidth = Math.min(r.contentMaxWidth, r.width);
  const isTablet = minSide >= TABLET_MIN_SIDE;

  const role = selectedRole === 'manager' ? 'manager' : 'attendant';
  const roleLabel = role === 'manager' ? 'gerente' : 'atendente';

  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  async function onSubmit() {
    if (!username.trim() || !password) return setError('Preencha usuário e senha.');
    if (password !== confirm)          return setError('As senhas não coincidem.');
    if (password.length < 6)           return setError('A senha precisa ter pelo menos 6 caracteres.');

    setError(''); setLoading(true);
    try {
      await registerRequest({ username: username.trim(), password, role });
      setSuccess(true);
    } catch (err) {
      setError(err?.uiMessage || 'Não foi possível cadastrar.');
    } finally { setLoading(false); }
  }

  const inputFieldStyle = {
    height: ui.inputHeight,
    paddingHorizontal: ui.inputPaddingH,
    ...(isTablet && { borderRadius: radii.lg, borderWidth: 2 }),
  };
  const inputTextStyle = { fontSize: ui.inputFontSize };
  const inputLabelStyle = { fontSize: ui.inputLabelFontSize };

  return (
    <Screen scroll background={colors.bgScreen} keyboardOffset={0}>
      <DarkHeader
        title={`Cadastrar ${roleLabel}`}
        subtitle={`Crie sua conta de ${roleLabel}`}
        onBack={() => navigation.goBack()}
      />
      <View
        style={[
          styles.body,
          {
            padding: ui.bodyPadding,
            maxWidth: isTablet ? '94%' : contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
      >
        <Input
          label="Usuário"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{ marginBottom: ui.inputMarginBottom }}
          labelStyle={inputLabelStyle}
          fieldStyle={inputFieldStyle}
          inputStyle={inputTextStyle}
        />
        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: ui.inputMarginBottom }}
          labelStyle={inputLabelStyle}
          fieldStyle={inputFieldStyle}
          inputStyle={inputTextStyle}
        />
        <Input
          label="Confirmar senha"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          style={{ marginBottom: ui.inputMarginBottom }}
          labelStyle={inputLabelStyle}
          fieldStyle={inputFieldStyle}
          inputStyle={inputTextStyle}
        />
        {error ? (
          <Text style={[styles.error, { fontSize: ui.errorFontSize, marginTop: ui.errorMarginTop }]}>
            {error}
          </Text>
        ) : null}
        <View style={{ marginTop: ui.btnMarginTop }}>
          <Button
            title="CADASTRAR"
            onPress={onSubmit}
            loading={loading}
            size={isTablet ? 'lg' : undefined}
            style={[
              isTablet && styles.actionButton,
              { height: ui.buttonHeight },
            ]}
            textStyle={{ fontSize: ui.buttonFontSize }}
          />
        </View>
      </View>

      <FeedbackModal
        visible={success}
        title="Conta criada"
        message="Seu acesso foi cadastrado. Faça login para começar."
        onClose={() => { setSuccess(false); navigation.goBack(); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {},
  error: { color: colors.danger },
  actionButton: {
    borderRadius: radii.lg,
  },
});
