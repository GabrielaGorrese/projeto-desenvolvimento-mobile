import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Screen from '../components/Screen';
import DarkHeader from '../components/DarkHeader';
import Input from '../components/Input';
import Button from '../components/Button';
import FeedbackModal from '../components/FeedbackModal';
import { colors, radii, typography } from '../theme';
import { getApiBaseUrl, setApiBaseUrl, normalizeBaseUrl } from '../services/apiConfig';
import { reconnectSocket } from '../services/socket';

// Testa se o servidor responde, com timeout manual (o fetch do RN não tem timeout nativo).
async function pingServer(baseUrl, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // /api-docs sempre existe e não exige autenticação; qualquer resposta HTTP = servidor acessível.
    const res = await fetch(`${baseUrl}/api-docs`, { method: 'GET', signal: ctrl.signal });
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default function ApiConfigScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  // status: null | 'ok' | 'fail'
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setUrl(getApiBaseUrl());
  }, []);

  async function onTest() {
    const normalized = normalizeBaseUrl(url);
    if (!normalized) {
      setFeedback({ variant: 'danger', title: 'Atenção', message: 'Informe o endereço do servidor.' });
      return;
    }
    setTesting(true);
    setStatus(null);
    const ok = await pingServer(normalized);
    setStatus(ok ? 'ok' : 'fail');
    setTesting(false);
  }

  async function onSave() {
    const normalized = normalizeBaseUrl(url);
    if (!normalized) {
      setFeedback({ variant: 'danger', title: 'Atenção', message: 'Informe o endereço do servidor.' });
      return;
    }
    await setApiBaseUrl(normalized);
    reconnectSocket();
    setFeedback({
      variant: 'success',
      title: 'Conexão salva',
      message: `O app vai usar:\n${normalized}`,
      onClose: () => navigation.goBack(),
    });
  }

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" avoidKeyboard={false}>
      <DarkHeader
        title="Configurar conexão"
        subtitle="Endereço do servidor da API"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 560 }}>

          <Text style={styles.label}>Endereço do servidor</Text>
          <Input
            value={url}
            onChangeText={(t) => { setUrl(t); setStatus(null); }}
            placeholder="http://192.168.0.10:3000"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            fieldStyle={{ height: 64, paddingHorizontal: 18 }}
            inputStyle={{ fontSize: 18 }}
            style={{ marginBottom: 8 }}
          />

          <Text style={styles.hint}>
            <Feather name="info" size={13} color={colors.textMuted} />  Use o IP do computador/servidor onde a API
            está rodando, na mesma rede dos tablets. Ex.: http://192.168.0.10:3000
          </Text>

          {status === 'ok' ? (
            <View style={[styles.statusBox, { backgroundColor: '#E7F6EC' }]}>
              <Feather name="check-circle" size={18} color="#1E9E54" />
              <Text style={[styles.statusText, { color: '#1E7E45' }]}>Servidor encontrado. Conexão OK.</Text>
            </View>
          ) : status === 'fail' ? (
            <View style={[styles.statusBox, { backgroundColor: '#FBEAEA' }]}>
              <Feather name="x-circle" size={18} color={colors.danger} />
              <Text style={[styles.statusText, { color: colors.danger }]}>
                Não foi possível conectar. Verifique o IP, a porta e se a API está no ar.
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Button
              title="Testar conexão"
              variant="outline"
              onPress={onTest}
              loading={testing}
              icon={<Feather name="wifi" size={18} color={colors.primary} />}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <Button title="Salvar" onPress={onSave} />
          </View>

        </View>
      </ScrollView>

      <FeedbackModal
        visible={!!feedback}
        variant={feedback?.variant}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        okLabel="OK"
        onClose={() => { const cb = feedback?.onClose; setFeedback(null); cb?.(); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textDark, fontSize: 17, marginBottom: 8 },
  hint:  { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    padding: 14,
    borderRadius: radii.md,
    marginTop: 16,
  },
  statusText: { flex: 1, fontSize: 14, fontWeight: '600' },
});
