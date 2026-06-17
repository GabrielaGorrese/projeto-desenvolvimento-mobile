import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import DarkHeader from '../components/DarkHeader';
import FeedbackModal from '../components/FeedbackModal';
import { colors } from '../theme';
import { registerRequest } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

export default function RegisterScreen({ navigation }) {
  const { selectedRole } = useAuth();
  const r = useResponsive();
  const minSide = Math.min(r.width, r.height);
  const role = selectedRole === 'manager' ? 'manager' : 'attendant';
  const roleLabel = role === 'manager' ? 'gerente' : 'atendente';

  const bodyPadding = scaleSize(22, minSide);
  const errorFontSize = scaleSize(13, minSide);
  const errorMarginTop = scaleSize(6, minSide);
  const btnMarginTop = scaleSize(14, minSide);
  const inputHeight = Math.round(Math.max(48, Math.min(70, scaleSize(48, minSide))));
  const inputFontSize = scaleSize(16, minSide);
  const inputLabelFontSize = scaleSize(15, minSide);
  const inputPaddingH = scaleSize(16, minSide);
  const inputMarginBottom = scaleSize(14, minSide);
  const buttonHeight = Math.round(Math.max(50, Math.min(56, scaleSize(50, minSide))));
  const buttonFontSize = scaleSize(17, minSide);
  const contentMaxWidth = Math.min(r.contentMaxWidth, r.width);

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
    height: inputHeight,
    paddingHorizontal: inputPaddingH,
  };
  const inputTextStyle = { fontSize: inputFontSize };
  const inputLabelStyle = { fontSize: inputLabelFontSize };

  return (
    <Screen scroll background={colors.bgScreen} keyboardOffset={0}>
      <DarkHeader
        title={`Cadastrar ${roleLabel}`}
        subtitle={`Crie sua conta de ${roleLabel}`}
        onBack={() => navigation.goBack()}
      />
      <View style={[styles.body, { padding: bodyPadding, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <Input
          label="Usuário"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{ marginBottom: inputMarginBottom }}
          labelStyle={inputLabelStyle}
          fieldStyle={inputFieldStyle}
          inputStyle={inputTextStyle}
        />
        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: inputMarginBottom }}
          labelStyle={inputLabelStyle}
          fieldStyle={inputFieldStyle}
          inputStyle={inputTextStyle}
        />
        <Input
          label="Confirmar senha"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          style={{ marginBottom: inputMarginBottom }}
          labelStyle={inputLabelStyle}
          fieldStyle={inputFieldStyle}
          inputStyle={inputTextStyle}
        />
        {error ? (
          <Text style={[styles.error, { fontSize: errorFontSize, marginTop: errorMarginTop }]}>{error}</Text>
        ) : null}
        <View style={{ marginTop: btnMarginTop }}>
          <Button
            title="CADASTRAR"
            onPress={onSubmit}
            loading={loading}
            style={{ height: buttonHeight }}
            textStyle={{ fontSize: buttonFontSize }}
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
});
