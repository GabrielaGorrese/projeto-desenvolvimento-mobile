import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import DarkHeader from '../components/DarkHeader';
import FeedbackModal from '../components/FeedbackModal';
import { colors, typography } from '../theme';
import { registerRequest } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';


export default function RegisterScreen({ navigation }) {
  const { selectedRole } = useAuth();
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

  return (
    <Screen scroll background={colors.bgScreen} keyboardOffset={0}>
      <DarkHeader
        title={`Cadastrar ${roleLabel}`}
        subtitle={`Crie sua conta de ${roleLabel}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Input label="Usuário"        value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Input label="Senha"          value={password} onChangeText={setPassword} secureTextEntry />
        <Input label="Confirmar senha" value={confirm}  onChangeText={setConfirm}  secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{ marginTop: 14 }}>
          <Button title="CADASTRAR" onPress={onSubmit} loading={loading} />
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
  body:  { padding: 22 },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
});
